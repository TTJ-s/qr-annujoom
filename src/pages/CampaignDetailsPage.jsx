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
  const [addName, setAddName] = useState(false);

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

  const referred_by = localStorage.getItem("referred_by");
  
  const handleDonate = async () => {
    if (
      campaign.target_amount &&
      campaign.collected_amount >= campaign.target_amount
    ) {
      showToast(
        getText({
          en: "This campaign has already reached its target.",
          ml: "ഈ കാമ്പെയ്ൻ ഇതിനകം ലക്ഷ്യം നേടിയിട്ടുണ്ട്.",
        })
      );
      return;
    }

    const amountNum = parseInt(amount.replace(/[^0-9]/g, ""));

    if (!amountNum || amountNum <= 0) {
      showToast(
        getText({
          en: "Please enter a valid amount",
          ml: "ദയവായി സാധുവായ തുക നൽകുക",
        })
      );
      return;
    }

    if (addName && !donorName.trim()) {
      showToast(
        getText({
          en: "Please enter your name",
          ml: "ദയവായി നിങ്ങളുടെ പേര് നൽകുക",
        })
      );
      return;
    }

    try {
      setDonating(true);

      // CREATE DONATION + RAZORPAY ORDER
      const donation = await createOutsideDonation({
        campaign: id,
        amount: amountNum,
        currency: "INR",
        outside_user: addName ? { name: donorName } : undefined,
        referred_by: referred_by || undefined,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountNum * 100,
        currency: "INR",
        name: "Donation",
        description: campaign.title.en,
        order_id: donation.payment_id,

        handler: async function (razorpayResponse) {
          await verifyPayment({
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
            donation_id: donation._id,
          });

          // SUCCESS
          setDonationSuccess(true);
          localStorage.removeItem("referred_by");
          await loadCampaign();
        },

        prefill: {
          name: donorName || "",
        },

        theme: {
          color: "#e11d48",
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function () {
        showToast(
          getText({
            en: "Payment was cancelled or failed",
            ml: "പേയ്മെന്റ് റദ്ദാക്കുകയോ പരാജയപ്പെടുകയോ ചെയ്തു",
          })
        );
      });

      rzp.open();
    } catch (err) {
      showToast(
        getText({
          en: "Payment failed. Please try again.",
          ml: "പേയ്മെന്റ് പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
        })
      );
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
              <span className="text-xl">‹</span>
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
                <div className="flex items-center gap-2 bg-[rgba(13,42,77,1)] px-3 py-1.5 rounded-lg">
                  <span className="text-sm text-white font-semibold">
                    📅 {formatDate(campaign.target_date)}
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
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {getText({ en: "Enter Donation Amount", ml: "സംഭാവന തുക നൽകുക" })}
            </h2>

            {/* Amount Input */}
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
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleDonate();
                  }
                }}
              />
            </div>

            {/* Checkbox to add name */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addName}
                  onChange={(e) => setAddName(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <span className="text-sm text-gray-700">
                  {getText({
                    en: "Add your name to donation",
                    ml: "സംഭാവനയിൽ നിങ്ങളുടെ പേര് ചേർക്കുക",
                  })}
                </span>
              </label>
            </div>

            {/* Donor Name Input */}
            {addName && (
              <div className="mb-6">
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder={getText({
                    en: "Enter your name",
                    ml: "നിങ്ങളുടെ പേര് നൽകുക",
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleDonate();
                    }
                  }}
                />
              </div>
            )}

            {/* Donate Button */}
            <button
              onClick={handleDonate}
              disabled={donating || isTargetReached}
              className={`w-full py-3.5 rounded-lg font-semibold text-white transition ${
                donating || isTargetReached
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-rose-600 hover:bg-rose-700"
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
    </div>
  );
};

export default CampaignDetailsPage;
