import { User, Admin, SubAdmin, Customer, FinancialStats, ShippingRule } from './types';

// ============================================================================
// MOCK USERS DATA
// ============================================================================

export const mockAdmins: Admin[] = [
    {
        id: 'admin-001',
        email: 'admin@monican.com',
        name: 'Admin Principal',
        role: 'admin',
        permissions: ['all'],
        createdAt: '2025-01-01T00:00:00Z',
        lastLogin: '2025-11-24T20:00:00Z',
    },
];

export const mockSubAdmins: SubAdmin[] = [
    {
        id: 'subadmin-001',
        email: 'commis1@monican.com',
        name: 'Marc Tremblay',
        role: 'subadmin',
        code: 'SA-001',
        isActive: true,
        assignedBy: 'admin-001',
        createdAt: '2025-10-01T00:00:00Z',
        lastLogin: '2025-11-24T18:30:00Z',
    },
    {
        id: 'subadmin-002',
        email: 'commis2@monican.com',
        name: 'Julie Gagnon',
        role: 'subadmin',
        code: 'SA-002',
        isActive: true,
        assignedBy: 'admin-001',
        createdAt: '2025-10-15T00:00:00Z',
        lastLogin: '2025-11-24T16:00:00Z',
    },
    {
        id: 'subadmin-003',
        email: 'commis3@monican.com',
        name: 'François Leblanc',
        role: 'subadmin',
        code: 'SA-003',
        isActive: true,
        assignedBy: 'admin-001',
        createdAt: '2025-11-01T00:00:00Z',
        lastLogin: '2025-11-24T14:00:00Z',
    },
    {
        id: 'subadmin-004',
        email: 'commis4@monican.com',
        name: 'Sophie Bouchard',
        role: 'subadmin',
        code: 'SA-004',
        isActive: false,
        assignedBy: 'admin-001',
        createdAt: '2025-09-01T00:00:00Z',
        lastLogin: '2025-11-10T12:00:00Z',
    },
];

export const mockCustomers: Customer[] = [
    {
        id: 'cust-001',
        email: 'jean.dupont@example.com',
        name: 'Jean Dupont',
        role: 'customer',
        phone: '+1 514 555 0101',
        shippingAddresses: [
            {
                street: '123 Rue Principale',
                city: 'Montréal',
                state: 'QC',
                zip: 'H3Z 2Y7',
                country: 'CA',
            },
        ],
        totalOrders: 5,
        totalSpent: 892.45,
        createdAt: '2025-08-15T00:00:00Z',
        lastLogin: '2025-11-24T10:00:00Z',
    },
    {
        id: 'cust-002',
        email: 'alice.smith@example.com',
        name: 'Alice Smith',
        role: 'customer',
        phone: '+1 212 555 0199',
        shippingAddresses: [
            {
                street: '456 Broadway',
                city: 'New York',
                state: 'NY',
                zip: '10012',
                country: 'US',
            },
        ],
        totalOrders: 3,
        totalSpent: 345.67,
        createdAt: '2025-09-20T00:00:00Z',
        lastLogin: '2025-11-23T14:00:00Z',
    },
    {
        id: 'cust-003',
        email: 'carlos.r@example.com',
        name: 'Carlos Rodriguez',
        role: 'customer',
        phone: '+52 55 1234 5678',
        shippingAddresses: [
            {
                street: 'Av. Reforma 789',
                city: 'Ciudad de México',
                state: 'CDMX',
                zip: '06600',
                country: 'MX',
            },
        ],
        totalOrders: 1,
        totalSpent: 237.76,
        createdAt: '2025-11-24T00:00:00Z',
        lastLogin: '2025-11-24T08:00:00Z',
    },
];

// ============================================================================
// MOCK FINANCIAL DATA
// ============================================================================

export const mockFinancialStats: FinancialStats = {
    totalRevenue: 2456.78,
    revenueByCountry: [
        {
            country: 'US',
            revenue: 1245.32,
            currency: 'USD',
            orderCount: 5,
        },
        {
            country: 'CA',
            revenue: 892.45,
            currency: 'CAD',
            orderCount: 4,
        },
        {
            country: 'MX',
            revenue: 619.38,
            currency: 'MXN',
            orderCount: 3,
        },
    ],
    dailyRevenue: [
        { date: '2025-11-18', revenue: 156.78, orderCount: 1 },
        { date: '2025-11-19', revenue: 234.56, orderCount: 2 },
        { date: '2025-11-20', revenue: 345.67, orderCount: 2 },
        { date: '2025-11-21', revenue: 289.34, orderCount: 1 },
        { date: '2025-11-22', revenue: 412.89, orderCount: 2 },
        { date: '2025-11-23', revenue: 523.45, orderCount: 3 },
        { date: '2025-11-24', revenue: 494.09, orderCount: 3 },
    ],
    averageOrderValue: 204.73,
    topSellingProducts: [
        {
            productId: '1',
            productName: 'Tennis Urban Runner',
            unitsSold: 4,
            revenue: 359.96,
        },
        {
            productId: '9',
            productName: 'Sneakers Classic White',
            unitsSold: 3,
            revenue: 239.97,
        },
        {
            productId: '2',
            productName: 'Chemise Oxford Blue',
            unitsSold: 3,
            revenue: 135.00,
        },
        {
            productId: '5',
            productName: 'Baskets Running Pro',
            unitsSold: 2,
            revenue: 239.98,
        },
        {
            productId: '3',
            productName: 'Jeans Slim Fit Indigo',
            unitsSold: 2,
            revenue: 119.00,
        },
    ],
};

// ============================================================================
// MOCK SHIPPING RULES
// ============================================================================

export const mockShippingRules: ShippingRule[] = [
    {
        country: 'US',
        baseRate: 8.99,
        currency: 'USD',
        freeShippingThreshold: 100,
        estimatedDays: { min: 3, max: 7 },
    },
    {
        country: 'CA',
        baseRate: 12.50,
        currency: 'CAD',
        freeShippingThreshold: 150,
        estimatedDays: { min: 4, max: 10 },
    },
    {
        country: 'MX',
        baseRate: 25.00,
        currency: 'MXN',
        freeShippingThreshold: 200,
        estimatedDays: { min: 5, max: 14 },
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSubAdminByCode(code: string): SubAdmin | undefined {
    return mockSubAdmins.find(sa => sa.code === code && sa.isActive);
}

export function getCustomerById(id: string): Customer | undefined {
    return mockCustomers.find(c => c.id === id);
}

export function getShippingRuleByCountry(country: 'US' | 'CA' | 'MX'): ShippingRule | undefined {
    return mockShippingRules.find(sr => sr.country === country);
}
