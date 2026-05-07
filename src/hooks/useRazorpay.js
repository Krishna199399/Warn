import { useState, useEffect } from 'react';
import { paymentsApi } from '../api/payments.api';
import { toast } from 'sonner';

/**
 * Custom hook for Razorpay payment integration
 * @returns {Object} Payment methods and state
 */
export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      toast.error('Payment system unavailable');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  /**
   * Initialize Razorpay payment
   * @param {Object} options - Payment options
   * @param {number} options.amount - Amount in INR
   * @param {string} options.orderId - Order ID from your system
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onFailure - Failure callback
   * @param {Object} options.customerDetails - Customer info (name, email, phone)
   */
  const initiatePayment = async ({
    amount,
    orderId,
    onSuccess,
    onFailure,
    customerDetails = {}
  }) => {
    if (!razorpayLoaded) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Razorpay order on backend
      const { data } = await paymentsApi.createRazorpayOrder({
        amount,
        orderId
      });

      // Step 2: Configure Razorpay options
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'Warnamayii Krishi Resources',
        description: `Order #${orderId}`,
        image: '/logo-icon.png',
        order_id: data.orderId,
        prefill: {
          name: customerDetails.name || '',
          email: customerDetails.email || '',
          contact: customerDetails.phone || ''
        },
        theme: {
          color: '#d97706' // Amber-600
        },
        handler: async function (response) {
          try {
            // Step 3: Verify payment on backend
            const verifyResponse = await paymentsApi.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              onSuccess && onSuccess(response);
            } else {
              toast.error('Payment verification failed');
              onFailure && onFailure(new Error('Verification failed'));
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
            onFailure && onFailure(error);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment cancelled');
            setLoading(false);
            onFailure && onFailure(new Error('Payment cancelled'));
          }
        }
      };

      // Step 4: Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment');
      setLoading(false);
      onFailure && onFailure(error);
    }
  };

  return {
    initiatePayment,
    loading,
    razorpayLoaded
  };
};
