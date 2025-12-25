'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

interface Order {
  id: string;
  orderNumber?: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  trackingNumber?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface ShippingLabelProps {
  order: Order;
}

export default function ShippingLabel({ order }: ShippingLabelProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR Code
    const generateQRCode = async () => {
      const orderNumber = order.orderNumber || order.id;
      
      const shippingData = {
        orderNumber: orderNumber,
        orderId: order.id,
        customerName: order.customerName,
        address: {
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          zip: order.shippingAddress.zip,
          country: order.shippingAddress.country
        },
        phone: order.customerPhone || '',
        tracking: order.trackingNumber || '',
        date: order.date,
        type: 'shipping_label',
        version: '1.0'
      };

      const qrData = JSON.stringify(shippingData, null, 0);
      
      try {
        const dataUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setQrCodeUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    // Generate Barcode
    const generateBarcode = () => {
      try {
        const canvas = document.createElement('canvas');
        const orderNumber = order.orderNumber || order.id;
        
        // Use order number or tracking for barcode
        const barcodeValue = order.trackingNumber || orderNumber.replace(/[^0-9]/g, '').padStart(12, '0').slice(0, 12);
        
        JsBarcode(canvas, barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          margin: 5,
          background: '#ffffff',
          lineColor: '#000000'
        });
        
        setBarcodeUrl(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    };

    generateQRCode();
    generateBarcode();
  }, [order]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getCountryName = (country: string) => {
    const countries: { [key: string]: string } = {
      'US': 'UNITED STATES',
      'CA': 'CANADA',
      'MX': 'MEXICO',
      'FR': 'FRANCE',
      'UK': 'UNITED KINGDOM',
      'DE': 'GERMANY',
      'ES': 'SPAIN',
      'IT': 'ITALY'
    };
    return countries[country] || country.toUpperCase();
  };

  return (
    <div style={{
      width: '4in',
      height: '6in',
      background: '#fff',
      border: '2px solid #000',
      padding: '0.12in',
      boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      overflow: 'hidden'
    }}>
      {/* Header with logo and badge */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '2px solid #000',
        paddingBottom: '0.08in',
        marginBottom: '0.08in'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.1in'
        }}>
          <div style={{
            width: '0.45in',
            height: '0.45in',
            border: '2px solid #000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            flexShrink: 0
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}>
              <Image
                src="/logo.png"
                alt="MONICAN Logo"
                width={40}
                height={40}
                style={{
                  width: '80%',
                  height: '80%',
                  objectFit: 'contain'
                }}
                priority
              />
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.02in'
          }}>
            <div style={{
              fontSize: '0.2in',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }}>MONICAN</div>
            <div style={{
              fontSize: '0.07in',
              fontWeight: 400,
              textTransform: 'uppercase'
            }}>E-COMMERCE EXCELLENCE</div>
          </div>
        </div>
        <div style={{
          border: '2px solid #000',
          padding: '0.05in 0.1in',
          fontWeight: 900,
          fontSize: '0.1in',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>STANDARD</div>
      </div>

      {/* Order and date bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #000',
        padding: '0.06in 0',
        marginBottom: '0.08in',
        fontSize: '0.09in'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.02in'
        }}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>ORDER</span>
          <span style={{ fontWeight: 400, fontFamily: 'monospace' }}>#{order.orderNumber || order.id}</span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.02in'
        }}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>DATE</span>
          <span style={{ fontWeight: 400, fontFamily: 'monospace' }}>{formatDate(order.date)}</span>
        </div>
      </div>

      {/* Recipient section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.06in'
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: '0.11in',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          marginBottom: '0.06in',
          display: 'flex',
          alignItems: 'center',
          gap: '0.05in'
        }}>
          <span style={{ fontSize: '0.12in' }}>📦</span>
          <span>SHIP TO</span>
        </div>
        
        <div style={{
          border: '2px solid #000',
          padding: '0.12in',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.08in'
        }}>
          {/* Customer name */}
          <div style={{
            fontSize: '0.18in',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 1.2,
            marginBottom: '0.06in'
          }}>
            {order.customerName || 'N/A'}
          </div>
          
          {/* Address and QR Code side by side */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.12in',
            width: '100%'
          }}>
            {/* Address information - LEFT */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.04in',
              minWidth: 0
            }}>
              {order.shippingAddress ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.04in'
                }}>
                  <div style={{ fontSize: '0.1in', lineHeight: 1.4 }}>
                    {order.shippingAddress.street || ''}
                  </div>
                  <div style={{ fontSize: '0.1in', lineHeight: 1.4 }}>
                    {order.shippingAddress.city || ''}, {order.shippingAddress.state || ''}
                  </div>
                  <div style={{ fontSize: '0.1in', lineHeight: 1.4 }}>
                    {order.shippingAddress.zip || ''}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.1in', color: '#ef4444' }}>
                  Address not available
                </div>
              )}
            </div>
            
            {/* QR Code - RIGHT */}
            {qrCodeUrl && (
              <div style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end'
              }}>
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code Shipping"
                  style={{
                    width: '0.8in',
                    height: '0.8in',
                    border: '1px solid #000',
                    padding: '0.02in',
                    background: '#fff',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Separator line */}
          {order.shippingAddress && (
            <>
              <div style={{
                borderTop: '1px solid #000',
                width: '100%',
                margin: '0.06in 0'
              }}></div>
              
              {/* Country */}
              <div style={{
                fontSize: '0.12in',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginTop: 0
              }}>
                {getCountryName(order.shippingAddress.country || 'US')}
              </div>
              
              {/* Phone */}
              {order.customerPhone && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.06in',
                  marginTop: '0.04in',
                  fontSize: '0.1in'
                }}>
                  <span style={{ fontSize: '0.12in' }}>📞</span>
                  <span>{order.customerPhone}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Barcode */}
      {barcodeUrl && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '0.08in',
          padding: '0.06in',
          background: '#fff',
          border: '1px solid #000'
        }}>
          <img 
            src={barcodeUrl} 
            alt="Barcode"
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      )}

      {/* Sender section */}
      <div style={{
        border: '1px solid #000',
        padding: '0.08in',
        marginTop: '0.08in'
      }}>
        <div style={{
          fontSize: '0.1in',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          marginBottom: '0.06in'
        }}>FROM</div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.04in',
          alignItems: 'flex-start'
        }}>
          <div style={{ fontSize: '0.11in', fontWeight: 700, textTransform: 'uppercase' }}>MONICAN</div>
          <div style={{ fontSize: '0.09in', lineHeight: 1.4 }}>support@monican.shop</div>
          <div style={{ fontSize: '0.09in', lineHeight: 1.4 }}>www.monican.shop</div>
          <div style={{ fontSize: '0.09in', lineHeight: 1.4 }}>+1717-880-1479</div>
        </div>
        <div style={{
          border: '1px solid #000',
          minHeight: '0.4in',
          marginTop: '0.08in',
          width: '100%'
        }}></div>
      </div>
    </div>
  );
}

// Example usage for demonstration
function ExampleUsage() {
  const sampleOrder: Order = {
    id: 'ORD-2025-001',
    orderNumber: 'MON-12345678',
    customerName: 'John Smith',
    customerPhone: '+1 (555) 123-4567',
    date: '2025-12-25',
    trackingNumber: '1Z999AA10123456784',
    shippingAddress: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US'
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f3f4f6' }}>
      <ShippingLabel order={sampleOrder} />
    </div>
  );
}