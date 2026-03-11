// components/Footer.jsx
import React from 'react';
import { FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaApple, FaGooglePlay } from 'react-icons/fa';

const Footer = () => {
  const FooterSection = ({ title, links }) => (
    <div className="space-y-3">
      <h3 className="text-white font-semibold text-lg">{title}</h3>
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={index}>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Section - spans 3 columns on lg */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-white text-2xl font-bold">TurfZone</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Making sports accessible for everyone. Book your game anytime, anywhere.
            </p>
            
            {/* App Store Badges - Clean Version */}
            <div className="flex flex-wrap gap-3 pt-2">
              <a 
                href="#" 
                className="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600"
                aria-label="Download on the App Store"
              >
                <FaApple className="w-5 h-5 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] leading-3 text-gray-400">Download on the</span>
                  <span className="text-sm font-semibold -mt-0.5">App Store</span>
                </div>
              </a>
              
              <a 
                href="#" 
                className="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600"
                aria-label="Get it on Google Play"
              >
                <FaGooglePlay className="w-5 h-5 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] leading-3 text-gray-400">Get it on</span>
                  <span className="text-sm font-semibold -mt-0.5">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Explore Section - 2 columns on lg */}
          <div className="lg:col-span-2">
            <FooterSection 
              title="Explore" 
              links={['Find Grounds', 'Top Rated', 'Near Me', 'Member Perks']} 
            />
          </div>

          {/* Company Section - 2 columns on lg */}
          <div className="lg:col-span-2">
            <FooterSection 
              title="Company" 
              links={['About Us', 'Careers', 'Support', 'Terms']} 
            />
          </div>

          {/* Partners Section - 2 columns on lg */}
          <div className="lg:col-span-2">
            <FooterSection 
              title="Partners" 
              links={['List your Turf', 'Partner Login', 'Success Stories']} 
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Copyright */}
          <p className="text-gray-400 text-sm">
            © 2026 TurfZone. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex space-x-6">
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="Twitter"
            >
              <FaTwitter size={20} />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="Instagram"
            >
              <FaInstagram size={20} />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;