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
  Globe,
  Smartphone,
  Building2,
  Bot,
  Bell,
  Send,
  ShieldCheck,
  Award,
  Quote,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getRequest, postRequest } from '../services/api';

const StoryBehindSadhanaGpt = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to format raw dependency payload into structured state
  const formatDependency = (rawObj) => {
    if (!rawObj || typeof rawObj !== 'object') return null;
    return {
      ...rawObj,
      story_title: rawObj.story_title || '',
      story_desc: rawObj.story_desc || rawObj.story_description || '',
      story_content: rawObj.story_content || '',
      story_url: rawObj.story_url || '',
      story_url_text: rawObj.story_url_text || '',
      video_link: rawObj.video_link || rawObj.video_url || rawObj.video || '',
      dev_mobile: rawObj.dev_mobile || rawObj.mobile || '',
      dev_email: rawObj.dev_email || rawObj.email || '',
      fellow_developers: rawObj.fellow_developers || rawObj.team_members || rawObj.developers || '',
      tech_seva: rawObj.tech_seva || rawObj.tech_seva_projects || '',
      what_we_build: rawObj.what_we_build || rawObj.services_offered || rawObj.services || '',
      book_price: rawObj.book_price ? Number(rawObj.book_price) : 100,
      razorpay_key_id: rawObj.razorpay_key_id || rawObj.key_id || rawObj.razorpay_key || rawObj.rzp_key_id || ''
    };
  };

  const initialDep = formatDependency(location.state?.dependency) || {
    story_title: '',
    story_desc: '',
    story_content: '',
    story_url: '',
    story_url_text: '',
    video_link: '',
    dev_mobile: '',
    dev_email: '',
    fellow_developers: '',
    tech_seva: '',
    what_we_build: '',
    book_price: 100,
    razorpay_key_id: ''
  };

  // State management
  const [loading, setLoading] = useState(() => !location.state?.dependency);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [dependency, setDependency] = useState(initialDep);

  // Project Inquiry Form State
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  // Payment State
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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

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

      const endpoint = (userType === 'counsellor' || userType === 'counselor')
        ? '/counslor-user-profile'
        : '/user-profile';

      getRequest(endpoint, userId ? { user_id: userId } : {}, (response) => {
        const res = response?.data;
        const dataObj = res?.data || res || {};

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

    try {
      const storedUser = localStorage.getItem('user_details') || localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.name && !inquiryName) setInquiryName(parsed.name);
        if ((parsed.mobile || parsed.phone) && !inquiryPhone) setInquiryPhone(parsed.mobile || parsed.phone);
      }
    } catch (err) { }
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

  // Handle Razorpay Payment launch (Preserving exact working modal architecture)
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

  // Project Inquiry Handlers
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Unified Project Inquiry Handler sending email via backend emailQueue
  const handleSendProjectInquiry = () => {
    const name = inquiryName.trim();
    const phone = inquiryPhone.trim();
    const msg = inquiryMessage.trim();
    if (!msg) {
      showToast('Please enter your project details before submitting.', 'error');
      return;
    }

    setIsSubmittingInquiry(true);

    let userId = null;
    let userEmail = '';
    let userPhone = phone;

    try {
      const storedUser = localStorage.getItem('user_details') || localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userId = parsed.user_id || parsed.id || null;
        userEmail = parsed.email || '';
        if (!userPhone) userPhone = parsed.mobile || parsed.phone || '';
      }
    } catch (err) { }

    postRequest('/submit-project-inquiry', {
      name: name || 'Devotee / Supporter',
      message: msg,
      user_id: userId,
      email: userEmail,
      phone: userPhone
    }, (res) => {
      setIsSubmittingInquiry(false);
      const rData = res?.data || res;
      if (rData?.status === 1) {
        showToast('Thank you! Your project inquiry has been submitted. 🚀', 'success');
        setIsProjectModalOpen(false);
        setInquiryMessage('');
      } else {
        showToast(rData?.message?.[0] || 'Failed to send inquiry.', 'error');
      }
    }, (err) => {
      setIsSubmittingInquiry(false);
      showToast('Error submitting project inquiry.', 'error');
    });
  };

  // Parsers for team & tech seva
  const getFellowDevelopersList = () => {
    if (!dependency.fellow_developers) return [
      { name: 'Paramjeet Singh', role: 'Founder' },
      { name: 'Vivek Prajapati' },
      { name: 'Pradyumn' }
    ];
    if (Array.isArray(dependency.fellow_developers)) return dependency.fellow_developers;
    if (typeof dependency.fellow_developers === 'string') {
      try {
        const parsed = JSON.parse(dependency.fellow_developers);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
      return dependency.fellow_developers
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const getTechSevaList = () => {
    if (!dependency.tech_seva) {
      return [
        {
          project_name: 'Book Distribution Warehouse Management',
          description: 'Inventory and stock control for temple book distribution warehouses.',
          url: '#'
        },
        {
          project_name: 'Tech Seva Project',
          description: 'Automated Ekadashi and festival reminders for sadhakas worldwide.',
          url: '#'
        }
      ];
    }
    if (Array.isArray(dependency.tech_seva)) return dependency.tech_seva;
    if (typeof dependency.tech_seva === 'string') {
      try {
        const parsed = JSON.parse(dependency.tech_seva);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
    }
    return [];
  };

  const getWhatWeBuildList = () => {
    if (!dependency.what_we_build) return [];
    if (Array.isArray(dependency.what_we_build)) return dependency.what_we_build;
    if (typeof dependency.what_we_build === 'string') {
      try {
        const parsed = JSON.parse(dependency.what_we_build);
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
  const whatWeBuildList = getWhatWeBuildList();
  const whatsappNumber = (dependency.dev_mobile || '919876543210').replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-[#fffaf3] dark:bg-[#17120d] text-[#1f2937] dark:text-[#f5efe6] font-sans pb-28">
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#221a12]/80 backdrop-blur-md border-b border-[#f3e3c7] dark:border-[#3a2c1c] px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280] dark:text-[#b8ab9a] hover:text-[#ea580c] dark:hover:text-[#fdba74] transition-colors py-1 px-3 rounded-full hover:bg-[#fff3e0] dark:hover:bg-[#2e2217] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#ea580c] hover:to-[#f59e0b] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>Contribute 🧡</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#c2410c] via-[#f97316] to-[#f59e0b] p-6 sm:p-8 text-white shadow-xl shadow-orange-900/10 space-y-4"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-amber-100">
              BUILT WITH DEVOTION 🪷
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {dependency.story_title || 'Technology in the service of devotion'}
            </h1>

            <p className="text-amber-100/95 text-sm sm:text-base leading-relaxed max-w-2xl">
              {dependency.story_desc || ''}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#9a3412] font-bold text-sm shadow-md hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#ea580c]" />
                <span>Start a Project</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/40 font-bold text-sm hover:bg-white/30 active:scale-95 transition-all cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white text-white" />
                <span>Contribute 🧡</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-2xl p-3.5 sm:p-4 text-center space-y-0.5">
            <b className="block text-xl sm:text-2xl font-black text-[#ea580c] dark:text-[#fdba74]">2+</b>
            <span className="text-[11px] sm:text-xs text-[#6b7280] dark:text-[#b8ab9a] font-medium">Live seva projects</span>
          </div>
          <div className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-2xl p-3.5 sm:p-4 text-center space-y-0.5">
            <b className="block text-xl sm:text-2xl font-black text-[#ea580c] dark:text-[#fdba74]">24/7</b>
            <span className="text-[11px] sm:text-xs text-[#6b7280] dark:text-[#b8ab9a] font-medium">Reminders running</span>
          </div>
          <div className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-2xl p-3.5 sm:p-4 text-center space-y-0.5">
            <b className="block text-xl sm:text-2xl font-black text-[#ea580c] dark:text-[#fdba74]">100%</b>
            <span className="text-[11px] sm:text-xs text-[#6b7280] dark:text-[#b8ab9a] font-medium">Built with love</span>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-[#221a12] rounded-3xl p-8 border border-[#f3e3c7] dark:border-[#3a2c1c] text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] dark:text-[#b8ab9a] text-sm font-medium">Loading details...</p>
          </div>
        ) : (
          <>
            {/* The Story Section - Collapsible story content */}
            {dependency.story_content && (() => {
              const fullText = dependency.story_content.trim();
              const isLongStory = fullText.length > 220;
              const displayText = (isLongStory && !isStoryExpanded)
                ? `${fullText.slice(0, 220).trim()}...`
                : fullText;

              return (
                <motion.section
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-3xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex items-center gap-2 text-[#1f2937] dark:text-[#f5efe6] font-bold text-xl">
                    <BookOpen className="w-5 h-5 text-[#ea580c]" />
                    <h2>The Story</h2>
                  </div>

                  <div className="text-sm sm:text-base text-[#1f2937]/90 dark:text-[#f5efe6]/90 leading-relaxed space-y-3 whitespace-pre-line font-medium transition-all">
                    {displayText}
                  </div>

                  {isLongStory && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setIsStoryExpanded(prev => !prev)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fff3e0] dark:bg-[#2e2217] text-[#ea580c] dark:text-[#fdba74] font-bold text-xs sm:text-sm hover:bg-amber-100 dark:hover:bg-[#3a2c1c] transition-colors border border-[#f3e3c7] dark:border-[#3a2c1c] cursor-pointer"
                      >
                        <span>{isStoryExpanded ? 'Show Less' : 'Read Full Story'}</span>
                        {isStoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </motion.section>
              );
            })()}
            {/* Video Section - Instagram Reel vertical 9:16 frame */}
            {hasVideoUrl && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#221a12] rounded-3xl p-5 sm:p-6 border border-[#f3e3c7] dark:border-[#3a2c1c] space-y-4 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-[#1f2937] dark:text-[#f5efe6] font-bold text-base">
                  <Video className="w-5 h-5 text-[#ea580c]" />
                  <h2>Watch the Story</h2>
                </div>

                {/* Reel Frame Container (9:16 ratio centered like a mobile screen) */}
                <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto overflow-hidden rounded-[2.5rem] bg-black shadow-2xl border-4 border-slate-800 dark:border-slate-900 aspect-[9/16]">
                  {isDirectVideoFile ? (
                    <video controls className="w-full h-full object-cover">
                      <source src={embedVideoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      src={embedVideoUrl}
                      title="Story Reel Video"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Our Work in Action / Tech Seva */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-3xl p-5 sm:p-6 space-y-4"
            >
              <div>
                <h2 className="text-xl font-bold text-[#1f2937] dark:text-[#f5efe6]">Our Work in Action</h2>
                <p className="text-xs sm:text-sm text-[#6b7280] dark:text-[#b8ab9a]">Real software, serving real communities today.</p>
              </div>

              <div className="space-y-3">
                {techSevaList.map((seva, idx) => {
                  const title = seva.project_name || seva.name || seva.title || 'Tech Seva Project';
                  const desc = seva.description || seva.desc || '';
                  const url = seva.url || seva.link || '';

                  return (
                    <div
                      key={idx}
                      className="bg-[#fff3e0] dark:bg-[#2e2217] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#f3e3c7]/60 dark:border-[#3a2c1c]"
                    >
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-[#1f2937] dark:text-[#f5efe6]">{title}</h3>
                        {desc && <p className="text-xs text-[#6b7280] dark:text-[#b8ab9a] leading-relaxed">{desc}</p>}
                      </div>
                      {url && url !== '#' && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#ea580c] dark:text-[#fdba74] hover:underline shrink-0 self-start sm:self-center"
                        >
                          <span>View Project</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* What We Can Build for You */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-3xl p-5 sm:p-6 space-y-4"
            >
              <div>
                <h2 className="text-xl font-bold text-[#1f2937] dark:text-[#f5efe6]">What We Can Build for You</h2>
                <p className="text-xs sm:text-sm text-[#6b7280] dark:text-[#b8ab9a]">From idea to launch, with one dedicated team.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {whatWeBuildList.map((item, idx) => {
                  const itemIcon = item.icon || item.emoji || '🚀';
                  const itemTitle = item.title || item.name || 'Service';
                  const itemDesc = item.description || item.desc || '';

                  return (
                    <div
                      key={idx}
                      className="bg-[#fff3e0] dark:bg-[#2e2217] rounded-2xl p-4 space-y-1 border border-[#f3e3c7]/60 dark:border-[#3a2c1c]"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-[#1f2937] dark:text-[#f5efe6]">
                        <span className="text-base">{itemIcon}</span>
                        <span>{itemTitle}</span>
                      </div>
                      {itemDesc && (
                        <p className="text-xs text-[#6b7280] dark:text-[#b8ab9a]">{itemDesc}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* Why Work With Us */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-3xl p-5 sm:p-6 space-y-4"
            >
              <div>
                <h2 className="text-xl font-bold text-[#1f2937] dark:text-[#f5efe6]">Why Work With Us</h2>
                <p className="text-xs sm:text-sm text-[#6b7280] dark:text-[#b8ab9a]">Skilled developers who treat your project like a seva.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#fff3e0] dark:bg-[#2e2217] rounded-2xl p-4 space-y-1 border border-[#f3e3c7]/60 dark:border-[#3a2c1c]">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1f2937] dark:text-[#f5efe6]">
                    <ShieldCheck className="w-4 h-4 text-[#ea580c]" />
                    <span>Honest & transparent</span>
                  </div>
                  <p className="text-xs text-[#6b7280] dark:text-[#b8ab9a]">Clear scope, fair pricing, regular updates.</p>
                </div>

                <div className="bg-[#fff3e0] dark:bg-[#2e2217] rounded-2xl p-4 space-y-1 border border-[#f3e3c7]/60 dark:border-[#3a2c1c]">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1f2937] dark:text-[#f5efe6]">
                    <Award className="w-4 h-4 text-[#ea580c]" />
                    <span>Proven in the field</span>
                  </div>
                  <p className="text-xs text-[#6b7280] dark:text-[#b8ab9a]">Used daily by temples and devotees.</p>
                </div>
              </div>
            </motion.section>

            {/* Hearts Behind SadhanaGPT */}
            {fellowDevsList.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-3xl p-5 sm:p-6 space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-[#1f2937] dark:text-[#f5efe6]">Hearts Behind SadhanaGPT</h2>
                  <p className="text-xs sm:text-sm text-[#6b7280] dark:text-[#b8ab9a]">Dedicated team serving technology with devotion.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {fellowDevsList.map((dev, idx) => {
                    const devName = typeof dev === 'string' ? dev : (dev.name || dev.title || 'Contributor');
                    const devRole = typeof dev === 'object' && dev.role ? dev.role : null;

                    return (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#fff3e0] dark:bg-[#2e2217] border border-[#f3e3c7]/70 dark:border-[#3a2c1c] text-xs font-semibold text-[#1f2937] dark:text-[#f5efe6]"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ea580c] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                          {devName.charAt(0).toUpperCase()}
                        </div>
                        <span>
                          {devName} {devRole && <small className="text-[#6b7280] dark:text-[#b8ab9a]">· {devRole}</small>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Words from Those We Serve */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
              className="bg-white dark:bg-[#221a12] border border-[#f3e3c7] dark:border-[#3a2c1c] rounded-3xl p-5 sm:p-6 space-y-4"
            >
              <div>
                <h2 className="text-xl font-bold text-[#1f2937] dark:text-[#f5efe6]">Words from Those We Serve</h2>
                <p className="text-xs sm:text-sm text-[#6b7280] dark:text-[#b8ab9a]">What our users say.</p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#fff3e0] dark:bg-[#2e2217] rounded-2xl p-4 border border-[#f3e3c7]/60 dark:border-[#3a2c1c] space-y-2">
                  <p className="text-xs sm:text-sm italic text-[#1f2937] dark:text-[#f5efe6]">
                    “Stock counting that used to take days now takes minutes. Our warehouse team finally has clarity.”
                  </p>
                  <p className="text-[11px] font-semibold text-[#6b7280] dark:text-[#b8ab9a]">
                    — Warehouse Incharge, Temple Book Distribution
                  </p>
                </div>

                <div className="bg-[#fff3e0] dark:bg-[#2e2217] rounded-2xl p-4 border border-[#f3e3c7]/60 dark:border-[#3a2c1c] space-y-2">
                  <p className="text-xs sm:text-sm italic text-[#1f2937] dark:text-[#f5efe6]">
                    “The Ekadashi reminders reach me on time every month. A beautiful and sincere service.”
                  </p>
                  <p className="text-[11px] font-semibold text-[#6b7280] dark:text-[#b8ab9a]">
                    — Sadhaka, SadhanaGPT user
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Have a Project in Mind / Contact Section */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl bg-gradient-to-br from-[#7c2d12] to-[#c2410c] p-6 text-white shadow-lg space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Have a project in mind?</h2>
                <p className="text-xs sm:text-sm text-amber-200/90">Tell us what you need. We reply within 24 hours.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hello%20Paramjeet%2C%20I%20found%20you%20through%20SadhanaGPT%20and%20want%20to%20discuss%20a%20project.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-white text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Chat on WhatsApp</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/70" />
                </a>

                {dependency.dev_mobile && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-semibold">
                    <div className="min-w-0">
                      <small className="block text-[10px] text-amber-200">Call</small>
                      <a href={`tel:${dependency.dev_mobile}`} className="font-bold hover:underline truncate block">
                        {dependency.dev_mobile}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(dependency.dev_mobile, 'Mobile')}
                      className="p-1.5 hover:bg-white/20 rounded-lg text-amber-200 transition-colors cursor-pointer"
                    >
                      {copiedField === 'Mobile' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {dependency.dev_email && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-semibold sm:col-span-2">
                    <div className="min-w-0">
                      <small className="block text-[10px] text-amber-200">Email</small>
                      <a href={`mailto:${dependency.dev_email}`} className="font-bold hover:underline truncate block">
                        {dependency.dev_email}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(dependency.dev_email, 'Email')}
                      className="p-1.5 hover:bg-white/20 rounded-lg text-amber-200 transition-colors cursor-pointer"
                    >
                      {copiedField === 'Email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Action button opening Project Inquiry Modal */}
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(true)}
                className="w-full py-3.5 px-5 rounded-2xl bg-white text-[#7c2d12] font-extrabold text-sm hover:bg-amber-50 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#ea580c]" />
                <span>Tell Us About Your Project 🚀</span>
              </button>
            </motion.section>

            {/* Your Contributions Matter Card */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="bg-[#fff3e0] dark:bg-[#2e2217] border-2 border-dashed border-[#f59e0b] rounded-3xl p-6 text-center space-y-3"
            >
              <div className="text-3xl">🧡</div>
              <h2 className="text-xl font-bold text-[#1f2937] dark:text-[#f5efe6]">Your Contributions Matter</h2>
              <p className="text-xs sm:text-sm text-[#6b7280] dark:text-[#b8ab9a] max-w-md mx-auto leading-relaxed">
                To help us serve others. Every offering keeps SadhanaGPT free for devotees and funds new seva projects.
              </p>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#ea580c] hover:to-[#f59e0b] text-white font-extrabold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Offer Your Contribution 🙏</span>
              </button>
            </motion.section>
          </>
        )}

        <footer className="text-center text-xs text-[#6b7280] dark:text-[#b8ab9a] pt-4 pb-12">
          Made with love for every devotee 🪷
        </footer>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#221a12]/95 backdrop-blur-md border-t border-[#f3e3c7] dark:border-[#3a2c1c] px-4 py-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsProjectModalOpen(true)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#fff3e0] dark:bg-[#2e2217] text-[#7c2d12] dark:text-[#fdba74] border border-[#f59e0b] font-bold text-xs sm:text-sm text-center truncate hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Start a Project
          </button>

          <a
            href={`https://wa.me/${whatsappNumber}?text=Hello%20Paramjeet%2C%20I%20found%20you%20through%20SadhanaGPT.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#25d366] text-white font-bold text-xs sm:text-sm text-center truncate hover:bg-[#20bd5a] transition-colors cursor-pointer"
          >
            💬 WhatsApp
          </a>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#ea580c] text-white font-extrabold text-xs sm:text-sm text-center truncate shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Contribute 🧡
          </button>
        </div>
      </div>

      {/* MODAL 1: Have a Project in Mind? (Inquiry Form Modal) */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="w-full max-w-lg bg-[#7c2d12] text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 relative border border-white/20"
            >
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 pr-6">
                <h3 className="text-xl font-extrabold text-white">Have a project in mind?</h3>
                <p className="text-xs text-amber-200">
                  Tell us what you need. We reply within 24 hours.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white text-[#1f2937] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200 uppercase tracking-wider">Contact Number</label>
                  <input
                    type="tel"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="Enter your contact number"
                    className="w-full bg-white text-[#1f2937] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200 uppercase tracking-wider">Project Details</label>
                  <textarea
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Tell us about your project requirements..."
                    className="w-full bg-white text-[#1f2937] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendProjectInquiry}
                    disabled={isSubmittingInquiry}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#ea580c] hover:to-[#f59e0b] text-white font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer active:scale-95 transition-all border border-white/20"
                  >
                    {isSubmittingInquiry ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>Submit Project Inquiry 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Offer Your Love / Contribution Modal (Razorpay) */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-md bg-gradient-to-br from-[#ea580c] via-[#f97316] to-[#f59e0b] text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative border border-white/20"
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
