import { motion } from "motion/react";
import { Shield, Zap, Repeat, TrendingUp, Users, Globe } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure & Audited",
    description:
      "Smart contracts audited by leading security firms. Your tokens are protected in transparent, immutable vaults.",
  },
  {
    icon: Zap,
    title: "Instant Execution",
    description:
      "Lock, mint, and redeem in seconds. No waiting periods, no delays, just pure DeFi speed.",
  },
  {
    icon: Repeat,
    title: "1:1 Redeemable",
    description:
      "Every bTOKEN is backed 1:1 by locked tokens. Redeem your original assets anytime at guaranteed parity.",
  },
  {
    icon: TrendingUp,
    title: "New Liquidity",
    description:
      "Create liquidity pools with bTOKENs while holding your memecoins. Trade without selling.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Built by degens, for degens. Governance rights for token holders to shape the platform's future.",
  },
  {
    icon: Globe,
    title: "Multi-Chain Ready",
    description:
      "Start on Ethereum, expand everywhere. Cross-chain derivatives for maximum flexibility.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-crypto-blue/5 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-deep-blue/5 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="gradient-text">Buffcat</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The most advanced derivatives platform for speculative assets
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="bg-background border-4 border-primary p-8 neo-shadow h-full group cursor-pointer hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-14 h-14 bg-crypto-blue/10 border-2 border-primary flex items-center justify-center mb-6 group-hover:bg-crypto-blue/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
