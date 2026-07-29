import crypto from 'crypto';

export function generateLiqPayLink(userId, type, amount) {
  const timestamp = Date.now();
  const orderId = `${type}_${userId}_${timestamp}`;

  const data = {
    public_key: process.env.LIQPAY_PUBLIC_KEY,
    version: '3',
    action: 'pay',
    amount: amount.toString(),
    currency: 'UAH',
    order_id: orderId,
    description: type === 'report' 
      ? 'Персональний розрахунок нумерології' 
      : 'Передплата на гороскоп',
    result_url: `${process.env.BOT_URL || 'https://your-domain.com'}/success`,
    server_url: `${process.env.BOT_URL || 'https://your-domain.com'}/liqpay-webhook`,
    language: 'uk'
  };

  const dataStr = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto
    .createHash('sha1')
    .update(process.env.LIQPAY_PRIVATE_KEY + dataStr + process.env.LIQPAY_PRIVATE_KEY)
    .digest('base64');

  return {
    url: `https://www.liqpay.ua/api/3/checkout?data=${dataStr}&signature=${signature}`,
    order_id: orderId,
    data: dataStr,
    signature: signature
  };
}

export function verifyLiqPaySignature(data, signature) {
  const hash = crypto
    .createHash('sha1')
    .update(process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY)
    .digest('base64');

  return hash === signature;
}

export function parseLiqPayResponse(data) {
  try {
    const decoded = Buffer.from(data, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error parsing LiqPay response:', error);
    return null;
  }
}

export function extractOrderInfo(orderId) {
  const parts = orderId.split('_');
  if (parts.length < 3) return null;

  return {
    type: parts[0],
    userId: parts[1],
    timestamp: parseInt(parts[2])
  };
}
