import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, MessageSquare, X } from 'lucide-react';
import { postRequest } from '../../services/api';

const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const ContributeModal = ({
  isOpen,
  onClose,
  initialAmount = 100,
  razorpayKeyId = '',
  onSuccess
}) => {
  const [customAmount, setCustomAmount] = useState(initialAmount);
  const [customMessage, setCustomMessage] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (isOpen) {
      loadRazorpaySDK();
      setCustomAmount(initialAmount || 100);
    }
  }, [isOpen, initialAmount]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const handleBuyBook = async () => {
    const isLoaded = await loadRazorpaySDK();
    if (!isLoaded) {
      showToast('Failed to load Razorpay payment SDK. Please check your internet connection.', 'error');
      return;
    }

    setIsProcessingPayment(true);

    let userName = 'Supporter';
    let userEmail = '';
    let userPhone = '';
    let userId = null;

    try {
      const storedUser = localStorage.getItem('user_details') || localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userName = parsed.name || parsed.username || 'Supporter';
        userEmail = parsed.email || '';
        userPhone = parsed.mobile || parsed.phone || '';
        userId = parsed.user_id || parsed.id || null;
      }
    } catch (err) {
      console.warn(err);
    }

    const paymentAmount = (customAmount && customAmount > 0) ? customAmount : (initialAmount || 100);

    postRequest('/create-razorpay-order', { amount: paymentAmount }, (res) => {
      const resData = res?.data;
      if (!resData || resData.status === 0 || !resData.data?.order_id) {
        setIsProcessingPayment(false);
        const errMsg = resData?.message?.[0] || 'Failed to create payment order.';
        showToast(errMsg, 'error');
        return;
      }

      const { order_id, amount: orderAmount, currency, key_id } = resData.data;
      const razorpayKey = key_id || razorpayKeyId;

      if (!razorpayKey) {
        setIsProcessingPayment(false);
        showToast('Razorpay Key ID is not configured.', 'error');
        return;
      }

      const options = {
        key: razorpayKey,
        amount: orderAmount,
        currency: currency || 'INR',
        order_id: order_id,
        name: 'SadhanaGpt',
        description: 'Offer Your Love - Support SadhanaGpt',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&h=120&fit=crop',
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone
        },
        notes: {
          user_message: customMessage || 'No message provided'
        },
        theme: {
          color: '#ea580c'
        },
        handler: function (response) {
          postRequest('/verify-razorpay-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: paymentAmount,
            userName,
            userEmail,
            user_id: userId,
            message: customMessage
          }, (verifyRes) => {
            setIsProcessingPayment(false);
            onClose?.();
            const vData = verifyRes?.data || verifyRes;
            if (vData?.status === 1) {
              showToast('Thank you so much for your support! 📚❤️', 'success');
              setCustomMessage('');
              if (onSuccess) onSuccess(vData);
            } else {
              showToast(vData?.message?.[0] || 'Payment verification failed.', 'error');
            }
          }, (err) => {
            setIsProcessingPayment(false);
            showToast('Error verifying payment on server.', 'error');
          });
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setIsProcessingPayment(false);
          showToast(`Payment failed: ${resp.error?.description || 'Transaction cancelled'}`, 'error');
        });
        rzp.open();
      } catch (err) {
        setIsProcessingPayment(false);
        showToast('Could not initiate payment window.', 'error');
      }
    }, (err) => {
      setIsProcessingPayment(false);
      showToast('Could not create payment order.', 'error');
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-md bg-gradient-to-br from-[#ea580c] via-[#f97316] to-[#f59e0b] text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative border border-white/20"
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold">Offer Your Love 📚</h3>
                  <p className="text-xs text-amber-100">
                    Choose support amount & personal note
                  </p>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="space-y-3 bg-black/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-100 block">
                  Select Support Amount (INR)
                </label>

                {/* Preset Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {[100, 250, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomAmount(amt)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${customAmount === amt
                        ? 'bg-white text-[#ea580c] shadow-md scale-105 ring-2 ring-white'
                        : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                        }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input Field */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-amber-100/90 block">Or enter custom amount:</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#ea580c]">₹</span>
                    <input
                      type="number"
                      min="10"
                      value={customAmount || ''}
                      onChange={(e) => setCustomAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white text-[#1f2937] font-extrabold text-sm rounded-xl py-3 pl-8 pr-4 shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-amber-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Enter amount in ₹"
                    />
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Personal Note (Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Leave an encouraging message for the team..."
                  className="w-full bg-white text-[#1f2937] font-medium rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none shadow-sm"
                />
              </div>

              {/* CTA Action Button */}
              <button
                type="button"
                onClick={handleBuyBook}
                disabled={isProcessingPayment}
                className="w-full py-3.5 px-6 rounded-2xl bg-white text-[#ea580c] font-extrabold text-sm sm:text-base hover:bg-amber-50 active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-[#ea580c] text-[#ea580c]" />
                    <span>Gift with Love & Support (₹{customAmount || 100}) ❤️</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[10001] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border text-xs sm:text-sm font-semibold ${toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
          >
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ContributeButton = ({
  buttonText = "Contribute 🧡",
  className = "",
  variant = "gradient",
  showIcon = true,
  initialAmount = 100,
  razorpayKeyId = '',
  onClick,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    setIsOpen(true);
  };

  const getVariantClasses = () => {
    if (className) return className;
    switch (variant) {
      case 'outline':
        return 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/40 font-bold text-sm hover:bg-white/30 active:scale-95 transition-all cursor-pointer';
      case 'light':
        return 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-orange-100 hover:bg-orange-200 text-[#ea580c] text-xs sm:text-sm font-extrabold active:scale-95 transition-all cursor-pointer border border-orange-200';
      case 'small':
        return 'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#ea580c] hover:to-[#f59e0b] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer';
      case 'full':
        return 'w-full py-4 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#ea580c] hover:to-[#f59e0b] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer';
      case 'gradient':
      default:
        return 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#ea580c] hover:to-[#f59e0b] text-white text-xs sm:text-sm font-extrabold shadow-md active:scale-95 transition-all cursor-pointer';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={getVariantClasses()}
      >
        {children ? (
          children
        ) : (
          <>
            {showIcon && <Heart className="w-4 h-4 fill-white text-white" />}
            <span>{buttonText}</span>
          </>
        )}
      </button>

      <ContributeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialAmount={initialAmount}
        razorpayKeyId={razorpayKeyId}
      />
    </>
  );
};

export default ContributeButton;
