import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Unlock } from "lucide-react";

export const Hero = () => {
  return (
    <section
      className="relative min-h-[90vh] flex items-center 
    justify-center overflow-hidden px-4 py-20"
    >
      {/* Animated background grid */}
      <div
        className="absolute inset-0 
      bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),
      linear-gradient(to_bottom,#00000008_1px,transparent_1px)] 
      bg-[size:64px_64px]"
      />

      {/* Floating accent elements */}
      <motion.div
        className="absolute top-20 right-20 w-32 h-32 
        bg-crypto-blue/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-20 left-20 w-40 h-40 
        bg-deep-blue/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <div className="container max-w-7xl relative z-10">
        <div className="flex flex-col gap-12 lg:gap-16">
          {/* Left content */}
          <motion.div
            className="w-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-block mb-6 mx-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span
                className="px-4 py-2 bg-crypto-blue/10 border-2 
              border-custom-primary-color text-sm font-bold 
              tracking-wider neo-shadow-sm"
              >
                DERIVATIVES FOR MEMECOINS
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 
              leading-tight text-center mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Lock Your Memes,
              <br />
              <span className="crypto-blue-gradient">Unlock Liquidity</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-8 
              lg:mx-0 text-center w-full mx-auto md:px-80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Buffcat transforms any memecoin into tradeable derivatives. Lock
              tokens, mint bTOKENs at 1:1, and unlock new DeFi opportunities
              without selling your holdings.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 justify-center 
              lg:justify-start mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button
                size="lg"
                className="bg-black hover:bg-black text-primary-foreground 
                border-primary neo-shadow hover:translate-x-1 border-2
                hover:translate-y-1 hover:shadow-none transition-all 
                font-bold text-lg px-8 cursor-pointer"
              >
                Launch dApp
                <ArrowRight className="ml-2" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-custom-primary-color 
                bg-white hover:bg-crypto-blue neo-shadow
                hover:translate-y-1 hover:translate-x-1 transition-all
                font-bold text-lg px-8 cursor-pointer text-black"
              >
                Learn More
              </Button>
            </motion.div>

            <motion.div
              className="mt-12 flex items-center gap-8 justify-center 
              lg:justify-start text-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 bg-crypto-blue rounded-full 
                animate-pulse"
                />
                <span className="font-semibold">1:1 Redeemable</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 bg-deep-blue rounded-full 
                animate-pulse"
                />
                <span className="font-semibold">Any Memecoin</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            className="flex-1 w-full max-w-md lg:max-w-lg mx-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative">
              {/* Main card */}
              <motion.div
                className="bg-custom-secondary-color border-4 
                border-primary p-8 neo-shadow-lg relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <Lock className="w-8 h-8" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <ArrowRight className="w-6 h-6 text-crypto-blue" />
                  </motion.div>
                  <Unlock className="w-8 h-8 text-crypto-blue" />
                </div>

                <div className="space-y-4">
                  <div className="bg-muted border-2 border-primary p-4">
                    <p className="text-xs font-bold mb-1">YOU LOCK</p>
                    <p className="text-2xl font-bold">1,000 PEPE</p>
                  </div>

                  <div className="text-center py-2">
                    <div
                      className="inline-block bg-crypto-blue 
                    text-custom-secondary-color px-4 py-1 font-bold text-sm"
                    >
                      1:1 RATIO
                    </div>
                  </div>

                  <div
                    className="bg-crypto-blue/10 border-2 
                  border-crypto-blue p-4"
                  >
                    <p className="text-xs font-bold mb-1">YOU RECEIVE</p>
                    <p className="text-2xl font-bold text-crypto-blue">
                      1,000 bPEPE
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Floating stats */}
              <motion.div
                className="absolute -top-6 -right-6 bg-accent-red 
                text-custom-secondary-color px-4 py-2 font-bold neo-shadow-sm"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                0.5% FEE
              </motion.div>

              <motion.div
                className="absolute -bottom-6 -left-6 
                bg-custom-secondary-color border-2 border-primary
                px-4 py-2 font-bold neo-shadow-sm"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                ⚡ INSTANT
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
