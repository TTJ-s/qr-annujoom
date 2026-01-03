import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCampaigns } from "../services/campaignService";
import { useLanguage } from "../components/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";
import {
  formatCurrency,
  formatDate,
  calculateProgress,
  cleanDescription,
} from "../utils/formatters";

const GeneralCampaignListPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { getText } = useLanguage();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const allCampaigns = await fetchCampaigns();

      // Only approved + active General Campaigns
      const generalCampaigns = allCampaigns.filter(
        (c) =>
          c.category === "General Campaign" &&
          c.status === "active" &&
          c.approval_status === "approved"
      );

      // Keep original multilingual fields
      const processedCampaigns = generalCampaigns.map((campaign) => ({
        ...campaign,
        title: campaign.title,
        description: campaign.description,
      }));

      // If exactly one → redirect to details
      if (processedCampaigns.length === 1) {
        navigate(`/campaign/${processedCampaigns[0]._id}`, { replace: true });
        return;
      }

      // Sort by closest due date
      const sorted = [...processedCampaigns].sort((a, b) => {
        const dateA = a.target_date
          ? new Date(a.target_date)
          : new Date("9999-12-31");
        const dateB = b.target_date
          ? new Date(b.target_date)
          : new Date("9999-12-31");
        return dateA - dateB;
      });

      setCampaigns(sorted);
    } catch (err) {
      console.error("Failed to load general campaigns:", err);
      setError("Unable to load General Campaigns");
    } finally {
      setLoading(false);
    }
  };

  const goToDetails = (id) => navigate(`/campaign/${id}`);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-rose-600 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadCampaigns}
            className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <h3 className="text-xl font-semibold mb-2">No General Campaigns</h3>
          <p className="text-gray-600 mb-6">
            There are no active General Campaigns at the moment.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }


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
                {getText({ en: "General Campaign", ml: "പൊതു കാമ്പെയ്ൻ" })}
              </span>
            </button>
            <LanguageToggle />
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Campaign List */}
          <div className="space-y-6">
            {campaigns.map((campaign) => {
              const progress = calculateProgress(
                campaign.collected_amount,
                campaign.target_amount
              );

              return (
                <div
                  key={campaign._id}
                  className="bg-white rounded-2xl shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                        {getText({
                          en: "General Campaign",
                          ml: "പൊതു കാമ്പെയ്ൻ",
                        })}
                      </span>
                      {campaign.target_date && (
                        <span className="text-xs font-medium bg-gray-100 px-3 py-1 rounded-full">
                          {getText({ en: "DUE DATE", ml: "അവസാന തീയതി" })}:{" "}
                          {formatDate(campaign.target_date)}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex gap-4 mb-4">
                      <img
                        src={
                          campaign.cover_image ||
                          "/assets/images/general-campaign.jpg"
                        }
                        alt={getText(campaign.title)}
                        className="w-24 h-24 rounded-xl object-cover"
                        onError={(e) => {
                          e.target.src = "/assets/images/general-campaign.jpg";
                        }}
                      />

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {getText(campaign.title)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {cleanDescription(getText(campaign.description), 120)}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    {campaign.target_amount && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>
                            <strong className="text-green-600">
                              {formatCurrency(campaign.collected_amount)}
                            </strong>{" "}
                            {getText({ en: "raised of", ml: "സമാഹരിച്ചത്" })}{" "}
                            {formatCurrency(campaign.target_amount)}
                          </span>
                          <span className="font-semibold">{progress}%</span>
                        </div>

                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => goToDetails(campaign._id)}
                        className="flex-1 py-3 border rounded-xl text-gray-700 hover:bg-gray-50 transition"
                      >
                        {getText({
                          en: "View details",
                          ml: "വിശദാംശങ്ങൾ കാണുക",
                        })}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralCampaignListPage;
