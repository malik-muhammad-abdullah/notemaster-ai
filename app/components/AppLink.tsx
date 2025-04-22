"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, ReactNode } from "react";

interface AppLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  prefetch?: boolean;
}

export default function AppLink({ href, children, className = "", onClick, prefetch }: AppLinkProps) {
  const router = useRouter();
  
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    
    // If it's not prevented by the onClick handler and it's an internal link
    if (!e.defaultPrevented && href.startsWith('/')) {
      e.preventDefault();
      
      // Dispatch navigation start event
      window.dispatchEvent(new Event('navigation-start'));
      
      // Slight delay to ensure the loading indicator shows
      setTimeout(() => {
        router.push(href);
      }, 50);
    }
  };
  
  return (
    <Link 
      href={href} 
      className={className} 
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  );
}