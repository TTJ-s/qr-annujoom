import React from "react";
import annujoomLogo from "../assets/images/annujoom_logo.png";

const InvalidAccessPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src={annujoomLogo}
            alt="Annujoom Logo"
            className="h-10 object-contain"
          />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 text-2xl">
            ⚠️
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Invalid Access
        </h2>

        {/* Message */}
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          This page can only be accessed by scanning a valid Annujoom QR code.
          <br />
          Please scan the QR code shared by an Annujoom member to continue.
        </p>

        {/* Hint box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
          Tip: Open your camera app and scan the QR code printed on the card or
          shared by a member.
        </div>
      </div>
    </div>
  );
};

export default InvalidAccessPage;
