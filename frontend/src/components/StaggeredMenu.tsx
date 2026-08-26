import React, { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './StaggeredMenu.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
  isExternal?: boolean;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logo?: React.ReactNode;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  changeMenuColorOnOpen?: boolean;
  accentColor?: string;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['var(--canvas-alt)', 'var(--border-subtle)', 'var(--canvas)'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logo,
  menuButtonColor = 'var(--ink)',
  openMenuButtonColor = 'var(--ink)',
  changeMenuColorOnOpen = true,
  accentColor = 'var(--brand-primary)',
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const textInnerRef = useRef<HTMLDivElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(['Menu', 'Close']);
  
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen });
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
      
      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];

    const layerStates = layers.map(el => ({ el, start: Number(gsap.getProperty(el, 'xPercent')) }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        itemEls,
        { 
          yPercent: 0, 
          rotate: 0, 
          duration: 1, 
          ease: 'power4.out', 
          stagger: { each: 0.1, from: 'start' } 
        },
        itemsStart
      );
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' }
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.35,
      ease: 'power3.in',
      stagger: {
        each: 0.05,
        from: 'end'
      },
      overwrite: 'auto',
      onComplete: () => {
        busyRef.current = false;
      }
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    const h = plusHRef.current;
    const v = plusVRef.current;
    if (!icon || !h || !v) return;

    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.timeline({ defaults: { ease: 'power4.out' } })
        .to(h, { rotate: 45, duration: 0.5 }, 0)
        .to(v, { rotate: -45, duration: 0.5 }, 0);
    } else {
      spinTweenRef.current = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
        .to(h, { rotate: 0, duration: 0.35 }, 0)
        .to(v, { rotate: 90, duration: 0.35 }, 0);
    }
  }, []);

  const animateColor = useCallback((opening: boolean) => {
    const btn = toggleBtnRef.current;
    if (!btn) return;
    colorTweenRef.current?.kill();
    
    if (changeMenuColorOnOpen) {
      const targetColor = opening ? openMenuButtonColor : menuButtonColor;
      colorTweenRef.current = gsap.to(btn, { color: targetColor, delay: 0.18, duration: 0.3, ease: 'power2.out' });
    }
  }, [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();


    const seq = opening ? ['Menu', '...', 'Close'] : ['Close', '...', 'Menu'];
    
    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });
    
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5,
      ease: 'power4.out'
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && 
          toggleBtnRef.current && !toggleBtnRef.current.contains(event.target as Node)) {
        toggleMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeOnClickAway, open, toggleMenu]);

  return (
    <div className={cn(
      "sm-scope",
      isFixed ? "fixed" : "relative",
      className
    )}>
      <div 
        className="staggered-menu-wrapper"
        style={{ '--sm-accent': accentColor } as React.CSSProperties}
        data-position={position}
      >
        {/* Layer Backgrounds */}
        <div ref={preLayersRef} className={cn("sm-prelayers", position === 'left' ? 'left-0' : 'right-0')}>
          {colors.slice(0, -1).map((c, i) => (
            <div 
              key={i} 
              className="sm-prelayer" 
              style={{ background: c }} 
            />
          ))}
        </div>

        {/* Header with Logo & Toggle */}
        <header className="sm-header">
          <div className="pointer-events-auto">
            {logo}
          </div>

          <button
            ref={toggleBtnRef}
            onClick={toggleMenu}
            className="sm-toggle pointer-events-auto"
            aria-expanded={open}
          >
            <div className="sm-toggle-text-wrapper">
              <div ref={textInnerRef} className="sm-toggle-text-inner">
                {textLines.map((line, i) => (
                  <span key={i} className="sm-toggle-line">{line}</span>
                ))}
              </div>
            </div>
            <div ref={iconRef} className="sm-toggle-icon">
              <span ref={plusHRef} className="sm-toggle-icon-h" />
              <span ref={plusVRef} className="sm-toggle-icon-v" />
            </div>
          </button>
        </header>

        {/* Menu Panel */}
        <aside
          ref={panelRef}
          className={cn(
            "staggered-menu-panel",
            position === 'left' ? 'left-0' : 'right-0'
          )}
          style={{ background: colors[colors.length - 1] }}
        >
          <div className="sm-scroll-mask" style={{ background: colors[colors.length - 1] }} />
          <div className="sm-panel-inner">
            <nav>
              <ul className="sm-nav-list">
                {items.map((item, idx) => (
                  <li key={idx} className="sm-nav-item">
                    {item.isExternal ? (
                      <a
                        href={item.link}
                        className="sm-nav-link"
                        aria-label={item.ariaLabel}
                        onClick={() => {
                          toggleMenu();
                        }}
                      >
                        {displayItemNumbering && (
                          <span className="sm-nav-number">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                        )}
                        <span className="sm-panel-itemLabel">
                          {item.label}
                        </span>
                      </a>
                    ) : (
                      <Link
                        to={item.link}
                        className="sm-nav-link"
                        aria-label={item.ariaLabel}
                        onClick={() => {
                          toggleMenu();
                        }}
                      >
                        {displayItemNumbering && (
                          <span className="sm-nav-number">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                        )}
                        <span className="sm-panel-itemLabel">
                          {item.label}
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {displaySocials && socialItems.length > 0 && (
              <div className="sm-socials-section">
                <h3 className="sm-socials-title">Docs & Links</h3>
                <ul className="sm-socials-list">
                  {socialItems.map((social, i) => (
                    <li key={i}>
                      <Link
                        to={social.link}
                        className="sm-socials-link"
                        onClick={() => toggleMenu()}
                      >
                        {social.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
