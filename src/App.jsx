import { Routes, Route } from 'react-router-dom'
import DonationSupportPage from './pages/DonationSupportPage'
import CampaignDetailsPage from './pages/CampaignDetailsPage'
import GeneralCampaignListPage from './pages/GeneralCampaignListPage'
import { LanguageProvider } from './components/LanguageContext';
import InvalidAccessPage from './pages/InvalidAccessPage';

function App() {
  return (
     <LanguageProvider>
    <Routes>
      <Route path="/" element={<InvalidAccessPage  />} />
      <Route path="/user/:user_id" element={<DonationSupportPage />} />
      <Route path="/campaign/:id" element={<CampaignDetailsPage />} />
      <Route path="/general-campaigns" element={<GeneralCampaignListPage />} />
    </Routes>
    </LanguageProvider>
  )
}

export default App
