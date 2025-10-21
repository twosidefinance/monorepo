import React from "react";
import { Twitter, Dot } from "lucide-react";
import { typography } from "@/styles/typography";
import { usePathname } from "next/navigation";
import ThemedButton from "./themed/button";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
      {pathname == "/" ? (
        <footer className="bg-transparent mb-6 ms-6 me-6 border-t border-l border-r border-[1px] border-gray-800 custom-box-shadow">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 md:flex md:justify-between lg:grid-cols-4 gap-8">
              {/* Logo and description */}
              <div className="col-span-1 lg:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <span className={typography.h1}>TWOSIDE</span>
                </div>
                <p className="mb-6">
                  A revolutionary multi-chain DeFi protocol helping you avoid
                  premature selling and earn a diverse range of rewards on the
                  side.
                </p>
                <div className="flex space-x-4">
                  <a
                    href="https://x.com/TwosideOfficial"
                    target="_blank"
                    className="hover:text-white text-gray-400 transition-colors duration-200"
                  >
                    <Twitter size={20} className="text-custom-secondary-color" />
                  </a>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h4 className="mb-4">Resources</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://docs.twoside.org/"
                      target="_blank"
                      className="cursor-pointer transition-colors duration-200"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="cursor-pointer transition-colors duration-200"
                    >
                      FAQs
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="mb-4 md:mb-0">
                © 2025 Twoside. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="bg-transparent flex justify-between mb-6 ms-14 me-14">
          <div className="text-custom-muted-text">© 2025 Twoside</div>
          <div className="flex items-center">
            <span style={{ color: "#21c187" }} className="flex justify-center">
              <Dot />
            </span>
            <span className="text-custom-muted-text">23218618</span>
          </div>
        </footer>
      )}
    </>
  );
};
