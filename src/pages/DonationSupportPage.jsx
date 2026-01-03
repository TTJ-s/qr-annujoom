import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCampaigns } from "../services/campaignService";
import { useLanguage } from "../components/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";
import { useParams } from "react-router-dom";

const DonationSupportPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { getText } = useLanguage();
  const { user_id } = useParams();

  const categoryImages = {
    Widow: "/assets/images/widow.jpg",
    "Ghusl Mayyit": "/assets/images/ghusal-mayyath.png",
    "General Campaign": "/assets/images/general-campaign.jpg",
    "General Funding": "/assets/images/general-funding.jpg",
    Orphan: "/assets/images/orphan.jpg",
    Zakat: "/assets/images/zakat.jpg",
    default: "/assets/images/general-campaign.jpg",
  };

  const categoryDescriptions = {
    "General Campaign": {
      en: "Donate for community initiatives and development",
      ml: "കമ്മ്യൂണിറ്റി സംരംഭങ്ങൾക്കും വികസനത്തിനും സംഭാവന നൽകുക",
    },
    "General Funding": {
      en: "Support overall social and welfare activities",
      ml: "മൊത്തത്തിലുള്ള സാമൂഹികവും ക്ഷേമപ്രവർത്തനങ്ങളും പിന്തുണയ്ക്കുക",
    },
    Zakat: {
      en: "Fulfill religious duty by helping eligible people",
      ml: "യോഗ്യരായവരെ സഹായിച്ചുകൊണ്ട് മതപരമായ കടമ നിറവേറ്റുക",
    },
    Orphan: {
      en: "Help children live, learn & grow",
      ml: "കുട്ടികളെ ജീവിക്കാനും പഠിക്കാനും വളരാനും സഹായിക്കുക",
    },
    Widow: {
      en: "Support widows with essential needs",
      ml: "അനിവാര്യമായ ആവശ്യങ്ങളിൽ വിധവകളെ പിന്തുണയ്ക്കുക",
    },
    "Ghusl Mayyit": {
      en: "Provide burial support for needy families",
      ml: "ആവശ്യമുള്ള കുടുംബങ്ങൾക്ക് ശവസംസ്കാര സഹായം നൽകുക",
    },
  };

  useEffect(() => {
    if (user_id) {
      localStorage.setItem("referred_by", user_id);
    }
  }, [user_id]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);

    try {
      const data = await fetchCampaigns();

      if (!data || data.length === 0) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      // Only active + approved campaigns
      const validCampaigns = data.filter(
        (c) => c.status === "active" && c.approval_status === "approved"
      );

      // One campaign per category
      const uniqueByCategory = Object.values(
        validCampaigns.reduce((acc, curr) => {
          if (!acc[curr.category]) acc[curr.category] = curr;
          return acc;
        }, {})
      );

      const finalCampaigns = uniqueByCategory.map((campaign) => ({
        ...campaign,
        // Keep original multilingual data
        title: campaign.title,
        description: campaign.description,
        image:
          campaign.cover_image ||
          categoryImages[campaign.category] ||
          categoryImages.default,
      }));

      setCampaigns(finalCampaigns);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (campaign) => {
    if (campaign.category === "General Campaign") {
      navigate("/general-campaigns");
    } else {
      navigate(`/campaign/${campaign._id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto">
        {/* Header with Language Toggle */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {getText({ en: "Donations", ml: "സംഭാവനകൾ" })}
            </h3>
            <LanguageToggle />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          {/* Subtitle */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {getText({
                en: "Donate & Support Our Community",
                ml: "നമ്മുടെ സമൂഹത്തെ സഹായിക്കുക",
              })}
            </h3>
            <p className="text-gray-600 text-sm">
              {getText({
                en: "Your contribution can change someone's life today.",
                ml: "നിങ്ങളുടെ സംഭാവന ഇന്ന് ആരുടെയെങ്കിലും ജീവിതം മാറ്റിമറിക്കും.",
              })}
            </p>
          </div>

          {/* Campaign Cards */}
          <div className="grid grid-cols-2 gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign._id}
                onClick={() => handleCardClick(campaign)}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden p-4"
              >
                <div className="mb-3">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src={campaign.image}
                      alt={campaign.category}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = categoryImages.default;
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {campaign.category}
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {getText(
                      categoryDescriptions[campaign.category] || {
                        en: "Your contribution can change a life today.",
                        ml: "നിങ്ങളുടെ സംഭാവന ഇന്ന് ഒരു ജീവിതം മാറ്റിമറിക്കും.",
                      }
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationSupportPage;
