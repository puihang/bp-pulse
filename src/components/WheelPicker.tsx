import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface WheelPickerProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;

export const WheelPicker = ({ options, value, onChange, className }: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIndex = options.indexOf(value);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  useEffect(() => {
    if (selectedIndex >= 0 && !isScrollingRef.current) {
      scrollToIndex(selectedIndex, false);
    }
  }, [selectedIndex, scrollToIndex]);

  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    isScrollingRef.current = true;
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(options.length - 1, index));
        
        if (options[clampedIndex] !== value) {
          onChange(options[clampedIndex]);
        }
        scrollToIndex(clampedIndex);
      }
      isScrollingRef.current = false;
    }, 100);
  };

  return (
    <div className={cn("relative", className)} style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      {/* Selection highlight */}
      <div 
        className="absolute left-0 right-0 pointer-events-none border-y border-primary/30 bg-primary/5 z-10"
        style={{ 
          top: ITEM_HEIGHT, 
          height: ITEM_HEIGHT 
        }}
      />
      
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
      
      {/* Scrollable container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        style={{ 
          scrollSnapType: 'y mandatory',
          paddingTop: ITEM_HEIGHT,
          paddingBottom: ITEM_HEIGHT
        }}
      >
        {options.map((option, index) => (
          <div
            key={option}
            className={cn(
              "flex items-center justify-center text-lg font-medium transition-all snap-center cursor-pointer",
              selectedIndex === index 
                ? "text-foreground scale-110" 
                : "text-muted-foreground/50 scale-90"
            )}
            style={{ height: ITEM_HEIGHT }}
            onClick={() => {
              onChange(option);
              scrollToIndex(index);
            }}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};
