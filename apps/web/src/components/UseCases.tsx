import { motion } from "motion/react";
import { Droplets, Gem, Target, Wallet } from "lucide-react";

const useCases = [
  {
    icon: Droplets,
    title: "Liquidity Provision",
    description:
      "Create new trading pairs with your bTOKENs. Earn fees while maintaining exposure to your favorite memecoins.",
    benefit: "Earn passive income without selling",
    gradient: "from-crypto-blue to-crypto-blue-dark",
  },
  {
    icon: Gem,
    title: "Collateral for Lending",
    description:
      "Use bTOKENs as collateral to borrow stablecoins or other assets. Leverage without liquidating your position.",
    benefit: "Access capital while HODLing",
    gradient: "from-deep-blue to-crypto-blue",
  },
  {
    icon: Target,
    title: "Yield Farming",
    description:
      "Stake bTOKENs in farming pools to earn additional rewards. Multiply your returns while tokens stay locked.",
    benefit: "Stack yields on your holdings",
    gradient: "from-red-800 to-deep-blue",
  },
  {
    icon: Wallet,
    title: "Portfolio Hedging",
    description:
      "Lock tokens during volatile periods. Use bTOKENs to establish hedging positions without market exposure.",
    benefit: "Manage risk strategically",
    gradient: "from-primary to-crypto-blue",
  },
];

export const UseCases = () => {
  return (
    <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
      <div className="container max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Unlock <span className="gradient-text">Infinite Possibilities</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Don't just hold your memecoins—put them to work. Buffcat opens up a
            parallel DeFi ecosystem for speculative assets.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <motion.div
                className="bg-background border-4 border-primary p-8 
                neo-shadow-card h-full group hover:translate-x-1 
                hover:translate-y-1 transition-all"
                whileHover={{ scale: 1.02 }}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-6 border-2 border-primary`}
                >
                  <useCase.icon className="w-8 h-8 text-background" />
                </div>

                <h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {useCase.description}
                </p>

                <div className="pt-4 border-t-2 border-primary/20">
                  <p className="text-sm font-bold text-crypto-blue">
                    ✦ {useCase.benefit}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Call to action box */}
        <motion.div
          className="mt-16 bg-custom-primary-color text-primary-foreground 
         p-12 neo-shadow-lg text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Maximize Your Memecoin Potential?
          </h3>
          <p
            className="text-xl mb-8 text-primary-foreground/80 max-w-2xl 
          mx-auto"
          >
            Join thousands of traders already using Buffcat to unlock liquidity
            and earn yields on their holdings.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <motion.button
              className="bg-crypto-blue text-custom-secondary-color font-bold  
              text-lg border-2 border-primary cursor-pointer px-8 py-4
              hover:translate-y-1 hover:shadow-none transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Launch dApp
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
