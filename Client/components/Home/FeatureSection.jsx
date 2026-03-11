import { FaBolt, FaShieldAlt, FaUsers } from "react-icons/fa";

const features = [
  {
    icon: <FaBolt className="text-green-500 w-6 h-6" />,
    title: "Instant Confirmation",
    desc: "No more waiting for calls. Book and get instant confirmation for your slots.",
  },
  {
    icon: <FaShieldAlt className="text-green-500 w-6 h-6" />,
    title: "Secure Payments",
    desc: "Multiple payment options including Pay at Venue for your convenience.",
  },
  {
    icon: <FaUsers className="text-green-500 w-6 h-6" />,
    title: "Manage Teams",
    desc: "Invite your friends, split bills, and manage your weekly games easily.",
  },
];

export default function FeatureSection() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Why Book with Us?</h2>
        <p className="text-gray-600 mb-12">The easiest way to get your game on.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition duration-300"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg mb-4 mx-auto shadow">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}