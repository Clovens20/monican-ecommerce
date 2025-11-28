'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AnimatedSection.module.css';

interface AnimatedSectionProps {
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export default function AnimatedSection({ 
    children, 
    delay = 0, 
    direction = 'up' 
}: AnimatedSectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [delay]);

    return (
        <div 
            ref={ref}
            className={`${styles.animatedSection} ${styles[direction]} ${isVisible ? styles.visible : ''}`}
        >
            {children}
        </div>
    );
}

