import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  fetchCampaignById,
  createOutsideDonation,
  verifyPayment,
} from "../services/campaignService";
import { useLanguage } from "../components/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";
import Toast from "../components/Toast";
import {
  formatCurrency,
  formatDate,
  calculateProgress,
  cleanDescription,
} from "../utils/formatters";
import PaymentMethodModal from "../components/PaymentMethodModal";
import { ChevronLeft } from "lucide-react";

const CampaignDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getText } = useLanguage();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "" });

  // Form state
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  const [showPaymentMethod, setShowPaymentMethod] = useState(false);

  const amountInputRef = useRef(null);
  const shouldFocusDonation = searchParams.get("donate") === "true";

  const showToast = (message) => {
    setToast({ show: true, message });
  };

  useEffect(() => {
    loadCampaign();
  }, [id]);

  useEffect(() => {
    if (shouldFocusDonation && amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 500);
    }
  }, [shouldFocusDonation, campaign]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await fetchCampaignById(id);
      if (!data) {
        throw new Error("Campaign not found");
      }

      // Keep original multilingual data
      const processedCampaign = {
        ...data,
        title: data.title,
        description: data.description,
      };

      setCampaign(processedCampaign);
    } catch (err) {
      setError(err.message);
      console.error("Error loading campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value) {
      value = "₹" + parseInt(value).toLocaleString("en-IN");
    }
    setAmount(value);
  };

  const isAllFieldsEmpty = () => {
    return (
      !amount && !donorName.trim() && !donorPhone.trim() && !donorEmail.trim()
    );
  };

  const validateFormBeforePayment = () => {
    const amountNum = parseInt(amount.replace(/[^0-9]/g, ""));

    if (!amountNum || amountNum <= 0) {
      showToast(
        getText({
          en: "Please enter a valid amount",
          ml: "ദയവായി സാധുവായ തുക നൽകുക",
        })
      );
      return false;
    }

    if (!donorName.trim()) {
      showToast(
        getText({
          en: "Please enter your name",
          ml: "ദയവായി നിങ്ങളുടെ പേര് നൽകുക",
        })
      );
      return false;
    }

    if (!donorPhone.trim()) {
      showToast(
        getText({
          en: "Please enter your mobile number",
          ml: "ദയവായി നിങ്ങളുടെ മൊബൈൽ നമ്പർ നൽകുക",
        })
      );
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(donorPhone)) {
      showToast(
        getText({
          en: "Please enter a valid 10-digit mobile number",
          ml: "സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക",
        })
      );
      return false;
    }

    if (!donorEmail.trim()) {
      showToast(
        getText({
          en: "Please enter your email address",
          ml: "ദയവായി നിങ്ങളുടെ ഇമെയിൽ വിലാസം നൽകുക",
        })
      );
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      showToast(
        getText({
          en: "Please enter a valid email address",
          ml: "സാധുവായ ഇമെയിൽ വിലാസം നൽകുക",
        })
      );
      return false;
    }

    return true;
  };

  const referred_by = localStorage.getItem("referred_by");

  // ONLY Razorpay UI logic (NO API CALL HERE)
  const openRazorpay = (donation) => {
    const convenienceFee = Number((donation.amount * 0.02).toFixed(2));
    const totalPayable = Number((donation.amount + convenienceFee).toFixed(2));

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(totalPayable * 100),
      currency: "INR",
      name: "Donation",
      description: campaign.title.en,
      order_id: donation.payment_id,

      handler: async (response) => {
        try {
          await verifyPayment({
            donation_id: donation._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          setDonationSuccess(true);
          setAmount("");
          setDonorName("");
          setDonorPhone("");
          setDonorEmail("");
          localStorage.removeItem("referred_by");
          await loadCampaign();
        } catch (err) {
          showToast(
            getText({
              en: "Payment verification failed",
              ml: "പേയ്മെന്റ് സ്ഥിരീകരണം പരാജയപ്പെട്ടു",
            })
          );
        }
      },

      prefill: {
        name: donorName,
        email: donorEmail,
        contact: donorPhone,
      },

      theme: { color: "#e11d48" },
    };

    new window.Razorpay(options).open();
  };

  const handlePaymentProceed = async (method) => {
    if (donating) return;
    setShowPaymentMethod(false);

    const amountNum = parseInt(amount.replace(/[^0-9]/g, ""));
    const convenienceFee = Number((amountNum * 0.02).toFixed(2));
    const totalPayable = Number((amountNum + convenienceFee).toFixed(2));

    const payload = {
      campaign: id,
      amount: totalPayable,
      currency: "INR",
      gateway: method,
      outside_user: {
        name: donorName.trim(),
      },
      phone: donorPhone.trim(),
      email: donorEmail.trim(),
      referred_by: referred_by || undefined,
    };

    try {
      setDonating(true);

      const donation = await createOutsideDonation(payload);

      // Razorpay
      if (method === "razorpay") {
        openRazorpay(donation);
        return;
      }

      // Mswipe
      if (method === "mswipe") {
        if (!donation.payment_url) {
          throw new Error("Payment URL not received");
        }

        // Redirect to Mswipe hosted page
        window.location.href = donation.payment_url;
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setDonating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {getText({
              en: "Loading campaign details...",
              ml: "കാമ്പെയ്ൻ വിശദാംശങ്ങൾ ലോഡ് ചെയ്യുന്നു...",
            })}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">
            {getText({
              en: "Campaign Not Found",
              ml: "കാമ്പെയ്ൻ കണ്ടെത്തിയില്ല",
            })}
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/")}
              className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
            >
              {getText({
                en: "Back to Campaigns",
                ml: "കാമ്പെയ്നുകളിലേക്ക് മടങ്ങുക",
              })}
            </button>
            <button
              onClick={loadCampaign}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {getText({ en: "Try Again", ml: "വീണ്ടും ശ്രമിക്കുക" })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const progress = calculateProgress(
    campaign.collected_amount,
    campaign.target_amount
  );
  const hasTarget = campaign.target_amount && campaign.target_amount > 0;
  const hasDueDate = campaign.target_date;
  const isTargetReached =
    campaign.target_amount &&
    campaign.collected_amount >= campaign.target_amount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Back Button and Language Toggle */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
            >
              <ChevronLeft size={32} className="p-1 -ml-1" />
              <span className="font-medium">
                {getText({
                  en: "Campaign Details",
                  ml: "കാമ്പെയ്ൻ വിശദാംശങ്ങൾ",
                })}
              </span>
            </button>
            <LanguageToggle />
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Success Message */}
          {donationSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <div className="text-green-500 mr-3 text-xl">✓</div>
                <div>
                  <p className="font-medium text-green-800">
                    {getText({
                      en: "Thank you for your donation!",
                      ml: "നിങ്ങളുടെ സംഭാവനയ്ക്ക് നന്ദി!",
                    })}
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    {getText({
                      en: "Your support means a lot. The campaign progress has been updated.",
                      ml: "നിങ്ങളുടെ പിന്തുണ വളരെ വലുതാണ്. കാമ്പെയ്ൻ പുരോഗതി അപ്ഡേറ്റ് ചെയ്തു.",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Title */}
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            {getText(campaign.title)}
          </h1>

          {/* Campaign Image */}
          <div className="relative mb-4 rounded-2xl overflow-hidden">
            <img
              src={campaign.cover_image}
              alt={getText(campaign.title)}
              className="w-full h-56 object-cover"
              onError={(e) => {
                e.target.src = "/assets/images/general-campaign.jpg";
              }}
            />
          </div>

          {/* Progress Section */}
          {hasTarget && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(campaign.collected_amount)}
                  </span>{" "}
                  {getText({ en: "raised of", ml: "സമാഹരിച്ചത്" })}{" "}
                  {formatCurrency(campaign.target_amount)}{" "}
                  {getText({ en: "goal", ml: "ലക്ഷ്യം" })}
                </span>
                <span className="text-sm font-semibold">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Due Date */}
          {hasDueDate && (
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">
                  {getText({ en: "DUE DATE", ml: "അവസാന തീയതി" })}
                </span>

                <div className="flex items-center gap-3 bg-[#0D2A4D] px-4 py-2 rounded-lg">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                  >
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 16H5V10h14zM9 14H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zm-8 4H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2z" />
                  </svg>

                  {/* Date */}
                  <span className="text-sm font-semibold tracking-wide text-white">
                    {formatDate(campaign.target_date)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {cleanDescription(getText(campaign.description), 5000)}
            </div>
          </div>

          {isTargetReached && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 font-semibold">
                {getText({
                  en: "Target achieved! Thank you for the amazing support.",
                  ml: "ലക്ഷ്യം കൈവരിച്ചു! മികച്ച പിന്തുണയ്ക്ക് നന്ദി.",
                })}
              </p>
            </div>
          )}

          {/* Donation Section */}
          <div className="mb-4">
            {/* Amount */}
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {getText({ en: "Enter Donation Amount", ml: "സംഭാവന തുക നൽകുക" })}
              <span className="text-red-500 ml-1">*</span>
            </h2>
            <div className="mb-4">
              <input
                ref={amountInputRef}
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder={getText({
                  en: "₹ Enter amount",
                  ml: "₹ തുക നൽകുക",
                })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Donor Name */}
            <h2 className="text-base text-gray-900 mb-4">
              {getText({
                en: "Enter Your Name",
                ml: "നിങ്ങളുടെ പേര് നൽകുക",
              })}
              <span className="text-red-500 ml-1">*</span>
            </h2>
            <div className="mb-6">
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder={getText({
                  en: "Enter your name *",
                  ml: "നിങ്ങളുടെ പേര് നൽകുക *",
                })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Mobile Number */}
            <h2 className="text-base text-gray-900 mb-4">
              {getText({
                en: "Mobile Number",
                ml: "മൊബൈൽ നമ്പർ",
              })}
              <span className="text-red-500 ml-1">*</span>
            </h2>
            <div className="mb-6">
              <input
                type="tel"
                value={donorPhone}
                onChange={(e) =>
                  setDonorPhone(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder={getText({
                  en: "Enter phone number",
                  ml: "മൊബൈൽ നമ്പർ നൽകുക",
                })}
                maxLength={10}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg
               focus:outline-none focus:ring-2 focus:ring-rose-500
               focus:border-transparent text-sm"
              />
            </div>

            {/* Email Address */}
            <h2 className="text-base text-gray-900 mb-4">
              {getText({
                en: "Email Address",
                ml: "ഇമെയിൽ വിലാസം",
              })}
              <span className="text-red-500 ml-1">*</span>
            </h2>
            <div className="mb-6">
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder={getText({
                  en: "Enter address",
                  ml: "ഇമെയിൽ വിലാസം നൽകുക",
                })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg
               focus:outline-none focus:ring-2 focus:ring-rose-500
               focus:border-transparent text-sm"
              />
            </div>

            {/* Donate Button */}
            <button
              onClick={() => {
                // Case 1: All empty → generic message
                if (isAllFieldsEmpty()) {
                  showToast(
                    getText({
                      en: "Please fill all required fields",
                      ml: "ദയവായി എല്ലാ നിർബന്ധിത വിവരങ്ങളും നൽകുക",
                    })
                  );
                  return;
                }

                // Case 2: Some fields filled → validate properly
                if (!validateFormBeforePayment()) {
                  return;
                }

                // Case 3: All valid → open payment method
                setShowPaymentMethod(true);
              }}
              disabled={donating || isTargetReached}
              className={`w-full py-3.5 rounded-lg font-semibold text-white transition ${
                donating || isTargetReached
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[rgba(188,9,45,1)] hover:bg-[rgba(160,8,38,1)]"
              }`}
            >
              {isTargetReached ? (
                getText({ en: "Target Reached", ml: "ലക്ഷ്യം പൂർത്തിയായി" })
              ) : donating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {getText({
                    en: "Processing...",
                    ml: "പ്രോസസ്സ് ചെയ്യുന്നു...",
                  })}
                </div>
              ) : (
                getText({ en: "Donate Now", ml: "ഇപ്പോൾ സംഭാവന നൽകുക" })
              )}
            </button>
          </div>
        </div>
      </div>
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: "" })}
      />

      {showPaymentMethod && (
        <PaymentMethodModal
          amount={parseInt(amount.replace(/[^0-9]/g, "")) || 0}
          onClose={() => setShowPaymentMethod(false)}
          onProceed={handlePaymentProceed}
        />
      )}
    </div>
  );
};

export default CampaignDetailsPage;
