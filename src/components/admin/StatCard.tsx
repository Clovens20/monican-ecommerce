import styles from './StatCard.module.css';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: string;
    iconColor?: 'green' | 'blue' | 'purple' | 'orange';
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

export default function StatCard({ label, value, icon, iconColor = 'green', trend }: StatCardProps) {
    const iconColorClass = {
        green: styles.iconGreen,
        blue: styles.iconBlue,
        purple: styles.iconPurple,
        orange: styles.iconOrange,
    }[iconColor];

    return (
        <div className={styles.card}>
            {icon && (
                <div className={`${styles.icon} ${iconColorClass}`}>
                    {icon}
                </div>
            )}
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
            {trend && (
                <div className={`${styles.trend} ${trend.isPositive ? styles.trendUp : styles.trendDown}`}>
                    <span>{trend.isPositive ? '↑' : '↓'}</span>
                    <span>{trend.value}</span>
                </div>
            )}
        </div>
    );
}
