import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface OfferPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const OfferPopup: React.FC<OfferPopupProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.email && formData.phone) {
      // Save form submission to localStorage
      localStorage.setItem('offerFormSubmitted', 'true');
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({ fullName: '', email: '', phone: '' });
      }, 2000);
    }
  };

  const handleClose = () => {
    // Track how many times user closed without submitting
    const closeCount = parseInt(localStorage.getItem('offerCloseCount') || '0');
    localStorage.setItem('offerCloseCount', String(closeCount + 1));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-2xl p-8 md:p-10 animate-fade-in-up relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} strokeWidth={1.5} />
        </button>

        {!submitted ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-red-500 mb-2">
                Limited Time Offer
              </p>
              <h2 className="text-3xl md:text-4xl font-serif-display text-black mb-2">
                Free Consultation
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get a complimentary 30-min session with our architects to discuss your project vision.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors text-sm"
                  required
                />
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors text-sm"
                  required
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors text-sm"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded font-bold tracking-widest uppercase text-xs hover:bg-gray-800 transition-colors mt-6"
              >
                Claim Free Session
              </button>
            </form>

            {/* Privacy Note */}
            <p className="text-xs text-gray-400 text-center mt-6">
              We respect your privacy. No spam, ever.
            </p>
          </>
        ) : (
          /* Success Message */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Thank You!</h3>
            <p className="text-sm text-gray-600">
              We'll contact you soon to schedule your free consultation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferPopup;
