import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Heart,
  Mail,
  Phone,
  ExternalLink,
  Video,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  Users,
  X,
  Code2,
  Globe
} from 'lucide-react';
import { getRequest, postRequest } from '../services/api';

const StoryBehindSadhanaGpt = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to format raw dependency payload into structured state
  const formatDependency = (rawObj) => {
    if (!rawObj || typeof rawObj !== 'object') return null;
    return {
      story_title: rawObj.story_title || '',
      story_content: rawObj.story_content || '',
      story_url: rawObj.story_url || '',
      story_url_text: rawObj.story_url_text || '',
      video_link: rawObj.video_link || rawObj.video_url || rawObj.video || '',
      dev_mobile: rawObj.dev_mobile || rawObj.mobile || '',
      dev_email: rawObj.dev_email || rawObj.email || '',
      fellow_developers: rawObj.fellow_developers || rawObj.team_members || rawObj.developers || '',
      tech_seva: rawObj.tech_seva || rawObj.tech_seva_projects || '',
      book_price: rawObj.book_price ? Number(rawObj.book_price) : 100,
      razorpay_key_id: rawObj.razorpay_key_id || rawObj.key_id || rawObj.razorpay_key || rawObj.rzp_key_id || ''
    };
  };

  const initialDep = formatDependency(location.state?.dependency) || {
    story_title: '',
    story_content: '',
    story_url: '',
    story_url_text: '',
    video_link: '',
    dev_mobile: '',
    dev_email: '',
    fellow_developers: '',
    tech_seva: '',
    book_price: 100,
    razorpay_key_id: ''
  };

  // State management
  const [loading, setLoading] = useState(() => !location.state?.dependency);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [dependency, setDependency] = useState(initialDep);

  const [customMessage, setCustomMessage] = useState('');
  const [customAmount, setCustomAmount] = useState(() => initialDep.book_price || 100);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  // Helper to load Razorpay SDK dynamically
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

  // Fetch backend data if not passed via navigation state (fallback)
  useEffect(() => {
    // If passed via navigation state, we already set it synchronously
    if (location.state?.dependency) {
      const formatted = formatDependency(location.state.dependency);
      if (formatted) {
        setDependency(formatted);
        if (formatted.book_price) setCustomAmount(Number(formatted.book_price));
        setLoading(false);
      }
    }

    const fetchStoryData = () => {
      let userId = null;
      let userType = null;
      try {
        const storedUser = localStorage.getItem('user_details') || localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userId = parsed.user_id || parsed.id;
          userType = parsed.user_type || parsed.role || parsed.type;
        }
      } catch (err) {
        console.warn('Could not parse user_details from localStorage:', err);
      }

      // Determine correct backend endpoint based on user role
      const endpoint = (userType === 'counsellor' || userType === 'counselor')
        ? '/counslor-user-profile'
        : '/user-profile';

      getRequest(endpoint, userId ? { user_id: userId } : {}, (response) => {
        const res = response?.data;
        const dataObj = res?.data || res || {};

        // Extract db_dependency object from all possible API response keys
        const depObj =
          dataObj.dependency ||
          dataObj.db_dependency ||
          dataObj.user?.dependency ||
          dataObj.user?.db_dependency ||
          res?.dependency ||
          res?.db_dependency ||
          {};

        if (depObj && typeof depObj === 'object' && Object.keys(depObj).length > 0) {
          const formatted = formatDependency(depObj);
          if (formatted) {
            setDependency(formatted);
            if (formatted.book_price) {
              setCustomAmount(Number(formatted.book_price));
            }
          }
        }

        setLoading(false);
      });
    };

    fetchStoryData();
    loadRazorpaySDK();
  }, [location.state]);

  // Parse YouTube video URL to embed format
  const getEmbedVideoUrl = (url) => {
    if (!url) return null;
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        return url;
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  // Handle Razorpay Payment launch
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

    const paymentAmount = (customAmount && customAmount > 0) ? customAmount : (dependency.book_price || 100);

    postRequest('/create-razorpay-order', { amount: paymentAmount }, (res) => {
      const resData = res?.data;
      if (!resData || resData.status === 0 || !resData.data?.order_id) {
        setIsProcessingPayment(false);
        const errMsg = resData?.message?.[0] || 'Failed to create payment order.';
        showToast(errMsg, 'error');
        return;
      }

      const { order_id, amount: orderAmount, currency, key_id } = resData.data;
      const razorpayKey = key_id || dependency.razorpay_key_id;

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
          color: '#f59e0b'
        },
        handler: function (response) {
          // Verify payment on backend
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
            setIsPaymentModalOpen(false);
            const vData = verifyRes?.data || verifyRes;
            if (vData?.status === 1) {
              showToast('Thank you so much for your support! 📚❤️', 'success');
              setCustomMessage('');
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

  // Copy helper
  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Fellow Developers parsing helper
  const getFellowDevelopersList = () => {
    if (!dependency.fellow_developers) return [];
    if (Array.isArray(dependency.fellow_developers)) return dependency.fellow_developers;
    if (typeof dependency.fellow_developers === 'string') {
      try {
        const parsed = JSON.parse(dependency.fellow_developers);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Comma separated string fallback
        return dependency.fellow_developers.split(',').map(item => item.trim()).filter(Boolean);
      }
    }
    return [];
  };

  // Tech Seva Projects parsing helper
  const getTechSevaList = () => {
    if (!dependency.tech_seva) return [];
    if (Array.isArray(dependency.tech_seva)) return dependency.tech_seva;
    if (typeof dependency.tech_seva === 'string') {
      try {
        const parsed = JSON.parse(dependency.tech_seva);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
    }
    return [];
  };

  const hasVideoUrl = Boolean(
    dependency.video_link &&
    typeof dependency.video_link === 'string' &&
    dependency.video_link.trim() !== '' &&
    dependency.video_link.trim() !== 'null' &&
    dependency.video_link.trim() !== 'undefined'
  );
  const embedVideoUrl = hasVideoUrl ? getEmbedVideoUrl(dependency.video_link) : null;
  const isDirectVideoFile = hasVideoUrl && (dependency.video_link.endsWith('.mp4') || dependency.video_link.endsWith('.webm'));
  const fellowDevsList = getFellowDevelopersList();
  const techSevaList = getTechSevaList();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-amber-50/20 to-orange-50/30 text-slate-800 pb-28">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors py-1 px-3 rounded-full hover:bg-slate-100/80 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Header CTA Button:🧡 Offer Your Love */}
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 fill-white" />
            <span>Offer Your Love</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Hero Title Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 p-6 sm:p-8 text-white shadow-xl shadow-amber-900/10"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-amber-100">
              Behind the Scenes
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {dependency.story_title || 'How SadhanaGPT Was Born 🪷'}
            </h1>
            <p className="text-amber-100/90 text-sm sm:text-base max-w-xl">
              A small offering, built with love for every devotee.
            </p>
          </div>
        </motion.div>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm font-medium">Loading story content...</p>
          </div>
        ) : (
          <>
            {/* Video Showcase Player - Completely hidden if no video URL in backend */}
            {hasVideoUrl && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                  <Video className="w-5 h-5 text-amber-500" />
                  <h2>Watch the Video</h2>
                </div>

                <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-inner aspect-video">
                  {isDirectVideoFile ? (
                    <video controls className="w-full h-full object-cover">
                      <source src={embedVideoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      src={embedVideoUrl}
                      title="Story Video"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Story Content & Link */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4"
            >
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h2>The Story</h2>
              </div>

              <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600 leading-relaxed space-y-3 whitespace-pre-line">
                {dependency.story_content || (
                  <p>
                    SadhanaGpt was conceptualized and crafted to support sadhakas in maintaining consistency and mindfulness in their spiritual practices. It aims to streamline daily tracking while providing insightful metrics and guidance.
                  </p>
                )}
              </div>

              {dependency.story_url && (
                <div className="pt-2">
                  <a
                    href={dependency.story_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition-colors border border-amber-200/60 group"
                  >
                    <span>{dependency.story_url_text || 'Visit Full Story'}</span>
                    <ExternalLink className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              )}
            </motion.div>

            {/* Fellow Developers Section */}
            {fellowDevsList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4"
              >
                <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                  <Users className="w-5 h-5 text-amber-500" />
                  <h2>🧡Hearts Behind SadhanaGPT</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fellowDevsList.map((dev, idx) => {
                    const devName = typeof dev === 'string' ? dev : (dev.name || dev.title || 'Contributor');
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100/80"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
                          {devName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{devName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Tech Seva We Offer Section */}
            {techSevaList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4"
              >
                <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                  {/* <Code2 className="w-5 h-5 text-amber-500" /> */}
                  <h2>🙏 Serving Devotees Through Technology💻</h2>
                </div>

                <div className="space-y-3">
                  {techSevaList.map((seva, idx) => {
                    const title = seva.project_name || seva.name || seva.title || 'Tech Seva Project';
                    const desc = seva.description || seva.desc || '';
                    const url = seva.url || seva.link || '';

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-100/90 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 text-amber-800 text-[11px] font-bold transition-colors shrink-0"
                            >
                              <span>View Project</span>
                              <ExternalLink className="w-3 h-3 text-amber-600" />
                            </a>
                          )}
                        </div>
                        {desc && (
                          <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/*🧡 Offer Your Love Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 text-white shadow-xl shadow-amber-600/15 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">Offer Your Love 📚</h3>
                    <p className="text-xs sm:text-sm text-amber-100">
                      Support the developer & help SadhanaGpt grow
                    </p>
                  </div>
                </div>
                <Heart className="w-6 h-6 text-amber-200 fill-amber-300 hidden sm:block animate-pulse" />
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-white text-amber-700 font-extrabold text-sm sm:text-base hover:bg-amber-50 active:scale-[0.99] transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-amber-600 text-amber-600" />
                <span>Offer Your Love </span>
              </button>
            </motion.div>

            {/* Developer Contact Card */}
            {(dependency.dev_mobile || dependency.dev_email) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  🧡We're Here to Serve
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dependency.dev_mobile && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-400">Mobile</p>
                          <a href={`tel:${dependency.dev_mobile}`} className="text-xs font-bold text-slate-700 hover:text-amber-600 truncate block">
                            {dependency.dev_mobile}
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(dependency.dev_mobile, 'Mobile')}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Copy phone"
                      >
                        {copiedField === 'Mobile' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {dependency.dev_email && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-400">Email</p>
                          <a href={`mailto:${dependency.dev_email}`} className="text-xs font-bold text-slate-700 hover:text-amber-600 truncate block">
                            {dependency.dev_email}
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(dependency.dev_email, 'Email')}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Copy email"
                      >
                        {copiedField === 'Email' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Sticky Bottom Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-amber-200/80 px-4 py-3 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-800 truncate">Your small offering</p>
            <p className="text-[11px] text-amber-700 font-medium truncate">a big seva 🙏</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>Offer Your Love</span>
          </button>
        </div>
      </div>

      {/*🧡 Offer Your Love Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-md bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative"
            >
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
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
              <div className="space-y-2 bg-black/10 backdrop-blur-md p-4 rounded-2xl">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-100">
                  Select Support Amount (INR)
                </label>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[100, 250, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomAmount(amt)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${customAmount === amt
                        ? 'bg-white text-amber-700 shadow-md scale-105'
                        : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <div className="relative flex-1 min-w-[110px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-200">₹</span>
                    <input
                      type="number"
                      min="10"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      className="w-full bg-white/20 border border-white/30 rounded-xl py-1.5 pl-7 pr-3 text-xs font-bold text-white placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-white"
                      placeholder="Custom"
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
                  placeholder="Leave an encouraging message for the developer..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-xs text-white placeholder-amber-100/70 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                />
              </div>

              {/* CTA Action Button */}
              <button
                type="button"
                onClick={handleBuyBook}
                disabled={isProcessingPayment}
                className="w-full py-3.5 px-6 rounded-2xl bg-white text-amber-700 font-extrabold text-sm sm:text-base hover:bg-amber-50 active:scale-[0.99] transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-amber-600 text-amber-600" />
                    <span>Gift with Love & Support (₹{customAmount || 100}) ❤️</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border text-xs sm:text-sm font-semibold ${toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
          >
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoryBehindSadhanaGpt;
