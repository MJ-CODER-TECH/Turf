import { FaBolt, FaShieldAlt, FaUsers } from "react-icons/fa";

const features = [
  {
    icon: <FaBolt className="text-green-400 w-6 h-6" />,
    title: "Instant Confirmation",
    desc: "No more waiting for calls. Book and get instant confirmation for your slots.",
  },
  {
    icon: <FaShieldAlt className="text-green-400 w-6 h-6" />,
    title: "Secure Payments",
    desc: "Multiple payment options including Pay at Venue for your convenience.",
  },
  {
    icon: <FaUsers className="text-green-400 w-6 h-6" />,
    title: "Manage Teams",
    desc: "Invite your friends, split bills, and manage your weekly games easily.",
  },
];

export default function FeatureSection() {
  return (
    <section className="bg-[#0a1628] dark:bg-[#0a1628] bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">

        {/* Header */}
        <span className="text-green-400 dark:text-green-400 text-green-600 text-xs font-bold tracking-[3px] uppercase">
          ✦ Features
        </span>
        <h2 className="dark:text-white text-gray-900 text-3xl font-extrabold mt-2 mb-2">
          Why Book <span className="text-green-400 dark:text-green-400 text-green-600">with Us?</span>
        </h2>
        <p className="dark:text-slate-400 text-slate-500 mb-12">
          The easiest way to get your game on.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group dark:bg-[#0d1f3c] bg-white dark:border-[#1a3a5c] border-gray-200 border p-6 rounded-xl transition-all duration-300 hover:border-green-500 dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
            >
              {/* Icon */}
              <div className="w-14 h-14 flex items-center justify-center dark:bg-[#0a1628] bg-gray-50 dark:border-[#1a3a5c] border-gray-200 border rounded-xl mb-5 mx-auto group-hover:border-green-500 group-hover:bg-green-500/10 transition-all duration-300">
                {feature.icon}
              </div>

              {/* Divider line */}
              <div className="w-8 h-0.5 bg-green-500 mx-auto mb-4 rounded-full" />

              <h3 className="dark:text-white text-gray-900 font-bold text-lg mb-2 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors duration-200">
                {feature.title}
              </h3>
              <p className="dark:text-slate-400 text-slate-500 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}