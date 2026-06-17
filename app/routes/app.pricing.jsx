/**
 * pricing.jsx — Updated for 3-plan structure
 * Plans: Free / Growth (plan_1) / Enterprise (plan_2)
 *
 * FIXES APPLIED:
 *  BUG-6:  Enterprise post-approval card correctly shows "Current" based on subscriptionPlan
 *  BUG-7:  upgradeRequired resets when subscriptionPlan is no longer 'free'
 *  BUG-8:  Modal re-open trap removed — onClose always allowed, sticky banner used instead
 *  BUG-10: plan_2 downgrade guard: rank 2 > rank 1 so plan_1 shows "Not Available" correctly
 *  BUG-13: SMS stats visibility driven by sms_allowed from backend, not re-derived isFree
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Page, Layout, Card, Button, Text, BlockStack, InlineStack,
    Box, Badge, Divider, Banner, List, Icon, Modal, Spinner,
    Toast, Frame, DataTable,
} from '@shopify/polaris';
import { CheckIcon, XIcon } from '@shopify/polaris-icons';
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

// ─────────────────────────────────────────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const url = new URL(request.url);
    return {
        shop: url.searchParams.get("shop") || "",
        host: url.searchParams.get("host") || "",
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_RANKS = { free: 0, plan_1: 1, plan_2: 2 };

const PLANS = [
    {
        id: 'free', name: 'Free', displayName: 'Free',
        tagline: 'Free forever', minShipments: 0, maxShipments: 150,
        pricePerShipment: 0, monthlyEstimate: 0, cappedAmount: 0,
        description: 'Perfect for new stores getting started',
        badge: null, isEnterprise: false,
    },
    {
        id: 'plan_1', name: 'Growth', displayName: 'Growth',
        tagline: 'For growing stores', minShipments: 0, maxShipments: 60000,
        pricePerShipment: 0.05, overageRate: 0.04, monthlyEstimate: null, cappedAmount: 15000,
        description: 'Up to 60,000 shipments/month. Overage at $0.04/shipment.',
        badge: 'Most Popular', badgeTone: 'success', isEnterprise: false,
    },
    {
        id: 'plan_2', name: 'Enterprise', displayName: 'Enterprise',
        tagline: 'Custom pricing', minShipments: 60001, maxShipments: null,
        pricePerShipment: null, monthlyEstimate: null, cappedAmount: null,
        description: 'Tailored solutions for high-volume operations',
        badge: 'Enterprise', badgeTone: 'info', isEnterprise: true,
    },
];

const FEATURE_GROUPS = [
    {
        group: 'Automated Delivery Updates', icon: '📦',
        features: [
            { name: 'Custom Email Alerts',         plans: { free: true,  plan_1: true,  plan_2: true  } },
            { name: 'SMS Alerts', note: 'Additional charges apply',
                                                    plans: { free: false, plan_1: true,  plan_2: true  } },
            { name: 'WhatsApp Notifications',      plans: { free: false, plan_1: true,  plan_2: true  } },
            { name: '13 Shipping Event Triggers',  plans: { free: true,  plan_1: true,  plan_2: true  } },
            { name: '8 Exception Event Triggers',  plans: { free: true,  plan_1: true,  plan_2: true  } },
        ],
    },
    {
        group: 'Incident Alerts & Resolution', icon: '🔔',
        features: [
            { name: 'Helpdesk Incident Alerts',     plans: { free: true,  plan_1: true,  plan_2: true  } },
            { name: 'Custom Helpdesk Triggers',     plans: { free: false, plan_1: true,  plan_2: true  } },
            { name: 'Automated Responses',          plans: { free: false, plan_1: true,  plan_2: true  } },
            { name: 'Helpdesk Support Widget',      plans: { free: true,  plan_1: true,  plan_2: true  } },
            { name: 'Real-time Shipment Dashboard', plans: { free: true,  plan_1: true,  plan_2: true  } },
        ],
    },
    {
        group: 'Branded Order Tracking', icon: '🎨',
        features: [
            { name: 'Custom Tracking Page',             plans: { free: true,  plan_1: true,  plan_2: true  } },
            { name: 'No-Code Page Builder & Templates', plans: { free: true,  plan_1: true,  plan_2: true  } },
            { name: 'Delivery Experience Feedback',     plans: { free: false, plan_1: true,  plan_2: true  } },
            { name: 'Split-shipment Tracking',          plans: { free: false, plan_1: true,  plan_2: true  } },
            { name: 'Self-serve Order Lookup',          plans: { free: true,  plan_1: true,  plan_2: true  } },
        ],
    },
];

const SMS_RATES = [
    { region: 'Canada',        price: 0.03 },
    { region: 'United States', price: 0.03 },
    { region: 'UK and Europe', price: 0.07 },
    { region: 'Others',        price: 0.07 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function openExternal(url) {
    if (typeof window === 'undefined') return;
    if (window.top && window.top !== window.self) window.top.location.href = url;
    else window.location.href = url;
}

function planRank(planId) { return PLAN_RANKS[planId] ?? 0; }

// ─────────────────────────────────────────────────────────────────────────────
// API SERVICE HOOK
// ─────────────────────────────────────────────────────────────────────────────

function usePricingService(shop) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

    const apiFetch = useCallback(async (path, body = {}) => {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ shop, ...body }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
        return result;
    }, [API_BASE, shop]);

    const getCurrentPlan = useCallback(async () => {
        const result = await apiFetch('/billingdemapp/getcurrent');
        if (!result.success) throw new Error(result.error || 'Invalid response');
        const { subscription, usage, overage, sms, estimated_total } = result.data;
        return {
            currentPlan:        usage?.current_tier             || 'free',
            subscriptionPlan:   subscription?.plan_id           || 'free',
            subscriptionStatus: subscription?.status            || 'ACTIVE',
            billingCycle:       subscription?.billing_cycle     || null,
            installedAt:        subscription?.installed_at      || null,
            nextBillingDate:    subscription?.next_billing_date || null,
            isFrozen:           subscription?.is_frozen         || false,
            shipmentCount:      usage?.current_count            || 0,
            tierName:           usage?.tier_name                || 'Free',
            rate:               usage?.rate                     || 0,
            tierMax:            usage?.tier_max                 || 150,
            cappedAmount:       usage?.capped_amount            || 0,
            balanceUsed:        usage?.balance_used             || 0,
            balanceRemaining:   usage?.balance_remaining        || 0,
            shipmentCharge:     usage?.shipment_charge          || 0,
            // BUG-13 FIX: use backend flag, never re-derive from plan id
            smsAllowed:         sms?.sms_allowed                || false,
            smsCount:           sms?.total_sms                  || 0,
            smsRate:            sms?.sms_rate                   || 0,
            smsRegion:          sms?.region                     || '',
            smsCharge:          sms?.total_charge               || 0,
            overage:            overage                         || null,
            estimatedTotal:     estimated_total                 || 0,
            trackingStopped:    usage?.tracking_stopped         || false,
        };
    }, [apiFetch]);

    const createSubscription = useCallback(async (planId) => {
        const result = await apiFetch('/billingdemapp/create', { plan_id: planId });
        if (!result.success) throw new Error(result.error || 'Failed to create subscription');
        return result;
    }, [apiFetch]);

    return { getCurrentPlan, createSubscription };
}

// ─────────────────────────────────────────────────────────────────────────────
// BANNERS
// ─────────────────────────────────────────────────────────────────────────────

function FrozenBanner() {
    return (
        <Banner
            title="Subscription paused — tracking disabled"
            tone="critical"
            action={{ content: 'Update Payment in Shopify', onAction: () => openExternal('https://www.shopify.com/admin/settings/billing') }}
        >
            <Text as="p">Shopify could not collect payment. Update your payment method to restore access immediately.</Text>
        </Banner>
    );
}

function DeclinedBanner({ onResubscribe }) {
    return (
        <Banner
            title="Billing not approved — please select a plan"
            tone="warning"
            action={{ content: 'Choose a Plan', onAction: onResubscribe }}
        >
            <Text as="p">You declined the billing approval. Select and approve a plan to continue tracking shipments.</Text>
        </Banner>
    );
}

function TrackingStoppedBanner({ onUpgrade }) {
    return (
        <Banner
            title="Tracking stopped — 150 shipment limit reached"
            tone="critical"
            action={{ content: 'Upgrade to Growth', onAction: onUpgrade }}
        >
            <Text as="p">
                Your Free plan allows up to 150 shipments per billing cycle. New shipments will not be tracked
                until you upgrade or your next billing cycle begins.
            </Text>
        </Banner>
    );
}

// BUG-8 FIX: sticky in-page banner instead of modal re-open trap
function UpgradeRequiredBanner({ shipmentCount, onUpgrade }) {
    return (
        <Banner
            title="Upgrade to continue tracking"
            tone="warning"
            action={{ content: 'Upgrade to Growth', onAction: onUpgrade }}
        >
            <Text as="p">
                You have <strong>{shipmentCount.toLocaleString()} shipments</strong> this month.
                Upgrade to Growth to continue tracking.
            </Text>
        </Banner>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// USAGE DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

function UsageDisplay({ planData }) {
    const {
        subscriptionPlan, shipmentCount, cappedAmount,
        balanceUsed, balanceRemaining,
        smsAllowed, smsCount, smsCharge, smsRegion, smsRate,
        estimatedTotal, overage, nextBillingDate, trackingStopped,
    } = planData;

    const planObj      = PLANS.find(p => p.id === subscriptionPlan) || PLANS[0];
    const isFree       = subscriptionPlan === 'free';
    const maxShipments = planObj.maxShipments;
    const percentage   = maxShipments ? Math.min((shipmentCount / maxShipments) * 100, 100) : 0;
    const isNearLimit  = percentage >= 80;
    const hasOverage   = !!overage;
    const capPct       = cappedAmount > 0 ? Math.min((balanceUsed / cappedAmount) * 100, 100) : 0;
    const barColor     = trackingStopped ? '#ef4444' : hasOverage ? '#f59e0b' : isNearLimit ? '#f59e0b' : '#10b981';

    return (
        <Card>
            <BlockStack gap="400">
                <InlineStack align="space-between">
                    <Text variant="headingMd" as="h3">Current Usage</Text>
                    <Badge tone={trackingStopped ? 'critical' : hasOverage ? 'warning' : isNearLimit ? 'warning' : 'success'}>
                        {trackingStopped ? 'Tracking Stopped' : hasOverage ? 'Over Limit' : isNearLimit ? 'Near Limit' : 'On Track'}
                    </Badge>
                </InlineStack>

                <BlockStack gap="150">
                    <InlineStack align="space-between">
                        <Text variant="bodySm" fontWeight="semibold">
                            Shipments tracked: {shipmentCount.toLocaleString()} / {maxShipments ? maxShipments.toLocaleString() : '∞'}
                        </Text>
                        {maxShipments && <Text variant="bodySm" tone="subdued">{percentage.toFixed(0)}%</Text>}
                    </InlineStack>
                    {maxShipments && (
                        <div style={{ width:'100%', height:8, background:'#e1e3e5', borderRadius:4, overflow:'hidden' }}>
                            <div style={{ width:`${percentage}%`, height:'100%', background:barColor, borderRadius:4, transition:'width 0.4s ease' }} />
                        </div>
                    )}
                </BlockStack>

                {isFree && isNearLimit && !trackingStopped && (
                    <Banner tone="warning">
                        <Text as="p">
                            <strong>{150 - shipmentCount} shipments</strong> remaining on the Free plan.
                            At 150, tracking stops. Upgrade to Growth to keep tracking.
                        </Text>
                    </Banner>
                )}

                {subscriptionPlan === 'plan_1' && cappedAmount > 0 && (
                    <BlockStack gap="150">
                        <InlineStack align="space-between">
                            <Text variant="bodySm" fontWeight="semibold">
                                Billing cap: ${balanceUsed.toFixed(2)} / ${cappedAmount.toLocaleString()}
                            </Text>
                            <Text variant="bodySm" tone="subdued">${balanceRemaining.toFixed(2)} remaining</Text>
                        </InlineStack>
                        <div style={{ width:'100%', height:6, background:'#e1e3e5', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${capPct}%`, height:'100%', background: capPct>=90?'#ef4444':capPct>=70?'#f59e0b':'#6366f1', transition:'width 0.4s ease' }} />
                        </div>
                        <Text variant="bodySm" tone="subdued">Shopify stops charging if cap is reached.</Text>
                    </BlockStack>
                )}

                <InlineStack gap="600" wrap>
                    <BlockStack gap="050">
                        <Text variant="bodySm" tone="subdued">Plan</Text>
                        <Text variant="bodyMd" fontWeight="semibold">{planObj.name}</Text>
                    </BlockStack>
                    <BlockStack gap="050">
                        <Text variant="bodySm" tone="subdued">Per Shipment</Text>
                        <Text variant="bodyMd" fontWeight="semibold">
                            {planObj.pricePerShipment != null && planObj.pricePerShipment > 0
                                ? `$${planObj.pricePerShipment.toFixed(2)}`
                                : planObj.isEnterprise ? 'Custom' : 'Free'}
                        </Text>
                    </BlockStack>
                    {smsAllowed && (
                        <>
                            <BlockStack gap="050">
                                <Text variant="bodySm" tone="subdued">SMS Sent</Text>
                                <Text variant="bodyMd" fontWeight="semibold">{smsCount.toLocaleString()}</Text>
                            </BlockStack>
                            <BlockStack gap="050">
                                <Text variant="bodySm" tone="subdued">SMS Charges</Text>
                                <Text variant="bodyMd" fontWeight="semibold">${smsCharge.toFixed(2)}</Text>
                            </BlockStack>
                        </>
                    )}
                    <BlockStack gap="050">
                        <Text variant="bodySm" tone="subdued">Est. Total</Text>
                        <Text variant="bodyMd" fontWeight="semibold">${estimatedTotal.toFixed(2)}</Text>
                    </BlockStack>
                    {nextBillingDate && (
                        <BlockStack gap="050">
                            <Text variant="bodySm" tone="subdued">Next Billing</Text>
                            <Text variant="bodyMd" fontWeight="semibold">{nextBillingDate}</Text>
                        </BlockStack>
                    )}
                </InlineStack>

                {smsRegion && smsAllowed && (
                    <Text variant="bodySm" tone="subdued">
                        SMS region: <strong>{smsRegion}</strong> @ ${smsRate.toFixed(2)}/SMS
                    </Text>
                )}

                {overage && (
                    <Banner tone="warning" title="Overage Shipments — Additional Charges Apply">
                        <BlockStack gap="200">
                            <Text as="p">
                                <strong>{shipmentCount.toLocaleString()} shipments</strong> tracked —
                                <strong> {overage.overage_count.toLocaleString()}</strong> are over the 60,000 limit at $0.04/shipment.
                            </Text>
                            <Box background="bg-surface" borderWidth="025" borderColor="border" borderRadius="200" padding="300">
                                <BlockStack gap="100">
                                    <InlineStack align="space-between">
                                        <Text variant="bodySm">Base: 60,000 × $0.05</Text>
                                        <Text variant="bodySm" fontWeight="semibold">${overage.base_charge.toFixed(2)}</Text>
                                    </InlineStack>
                                    <InlineStack align="space-between">
                                        <Text variant="bodySm" tone="warning">
                                            Overage: {overage.overage_count.toLocaleString()} × $0.04
                                        </Text>
                                        <Text variant="bodySm" fontWeight="semibold">+${overage.over_charge.toFixed(2)}</Text>
                                    </InlineStack>
                                    <Divider />
                                    <InlineStack align="space-between">
                                        <Text variant="bodySm" fontWeight="bold">Total Shipment Charge</Text>
                                        <Text variant="bodySm" fontWeight="bold">${overage.total_charge.toFixed(2)}</Text>
                                    </InlineStack>
                                </BlockStack>
                            </Box>
                        </BlockStack>
                    </Banner>
                )}
            </BlockStack>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN CARD
// ─────────────────────────────────────────────────────────────────────────────

function PlanCard({ plan, subscriptionPlan, subscriptionStatus, shipmentCount, onSelectPlan, onContactSales }) {
    // BUG-6 FIX: isCurrentSubscription is driven by subscriptionPlan (the plan_id from DB),
    // not subscriptionStatus — so Enterprise shows "Current" after approval correctly.
    const isCurrentSubscription = plan.id === subscriptionPlan;
    const subRank   = planRank(subscriptionPlan);
    const thisRank  = planRank(plan.id);
    // BUG-10 FIX: plan_2 rank=2, plan_1 rank=1 so enterprise->growth is correctly blocked
    const canSelect = thisRank >= subRank;
    const isFrozen  = subscriptionStatus === 'FROZEN';

    const estimatedCost = plan.id === 'plan_1' && shipmentCount > 0
        ? `$${(Math.min(shipmentCount, 60000) * 0.05 + Math.max(0, shipmentCount - 60000) * 0.04).toFixed(2)}`
        : null;

    let buttonLabel;
    if (plan.isEnterprise)          buttonLabel = 'Contact Sales';
    else if (isCurrentSubscription) buttonLabel = 'Current Plan';
    else if (!canSelect)            buttonLabel = 'Not Available';
    else                            buttonLabel = `Select ${plan.name}`;

    const handleClick = () => {
        if (plan.isEnterprise) { onContactSales(); return; }
        if (!isCurrentSubscription && canSelect) onSelectPlan(plan);
    };

    const cardBorder = isCurrentSubscription ? '2px solid #008060' : '1px solid #E4E5E7';
    const cardShadow = isCurrentSubscription ? '0 0 0 3px rgba(0,128,96,0.08)' : '0 1px 3px rgba(0,0,0,0.06)';

    return (
        <div style={{ display:'flex', flexDirection:'column', background:'#fff', border:cardBorder, borderRadius:12, boxShadow:cardShadow, overflow:'hidden', height:'100%' }}>
            <div style={{ padding:'20px 20px 16px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <Text variant="headingLg" as="h3">{plan.name}</Text>
                    <div style={{ flexShrink:0, marginLeft:8 }}>
                        {isCurrentSubscription && (
                            <Badge tone={isFrozen ? 'critical' : 'success'}>{isFrozen ? 'Frozen' : 'Current'}</Badge>
                        )}
                        {plan.badge && !isCurrentSubscription && (
                            <Badge tone={plan.badgeTone || 'info'}>{plan.badge}</Badge>
                        )}
                    </div>
                </div>
                <Text variant="bodySm" tone="subdued">{plan.tagline}</Text>
                <div style={{ marginTop:4 }}>
                    <Text variant="bodySm" tone="subdued">{plan.description}</Text>
                </div>
            </div>

            <div style={{ height:'1px', background:'#E4E5E7', margin:'0 20px' }} />

            <div style={{ padding:'16px 20px 8px 20px' }}>
                {plan.isEnterprise ? (
                    <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                        <Text variant="heading2xl" as="p" fontWeight="bold">Custom</Text>
                    </div>
                ) : plan.id === 'free' ? (
                    <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <Text variant="heading2xl" as="p" fontWeight="bold">$0</Text>
                        <Text variant="bodyLg" tone="subdued">/month</Text>
                    </div>
                ) : (
                    <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <Text variant="heading2xl" as="p" fontWeight="bold">$0.05</Text>
                        <Text variant="bodyLg" tone="subdued">/shipment</Text>
                    </div>
                )}
            </div>

            <div style={{ padding:'0 20px', minHeight:64 }}>
                <BlockStack gap="050">
                    {plan.id === 'free' && (
                        <>
                            <Text variant="bodySm" tone="subdued">Up to 150 shipments/month</Text>
                            <Text variant="bodySm" tone="subdued">Tracking stops at 150</Text>
                            <Text variant="bodySm" tone="subdued">No SMS notifications</Text>
                        </>
                    )}
                    {plan.id === 'plan_1' && (
                        <>
                            <Text variant="bodySm" tone="subdued">Up to 60,000 shipments/month</Text>
                            <Text variant="bodySm" tone="subdued">$0.04/shipment over 60,000</Text>
                            <Text variant="bodySm" tone="subdued">$15,000 billing cap · SMS extra</Text>
                        </>
                    )}
                    {plan.isEnterprise && (
                        <>
                            <Text variant="bodySm" tone="subdued">60,000+ shipments/month</Text>
                            <Text variant="bodySm" tone="subdued">Custom rate & billing cap</Text>
                            <Text variant="bodySm" tone="subdued">SMS extra · Dedicated support</Text>
                        </>
                    )}
                </BlockStack>
            </div>

            <div style={{ padding:'12px 20px 0 20px', minHeight:88 }}>
                {plan.id === 'plan_1' && estimatedCost && shipmentCount > 0 && (
                    <Banner tone="info">
                        <Text variant="bodySm">
                            Your {shipmentCount.toLocaleString()} shipments → est. <strong>{estimatedCost}/month</strong>
                        </Text>
                    </Banner>
                )}
                {!canSelect && !isCurrentSubscription && !plan.isEnterprise && (
                    <Banner tone="warning">
                        <Text variant="bodySm">Cannot downgrade from your current plan.</Text>
                    </Banner>
                )}
            </div>

            <div style={{ padding:'16px 20px 20px 20px', marginTop:'auto' }}>
                <Button
                    variant={plan.isEnterprise ? 'secondary' : isCurrentSubscription ? 'secondary' : 'primary'}
                    fullWidth
                    disabled={!plan.isEnterprise && (isCurrentSubscription || !canSelect)}
                    onClick={handleClick}
                >
                    {buttonLabel}
                </Button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING TABLE
// ─────────────────────────────────────────────────────────────────────────────

function PricingTable() {
    const shipmentRows = [
        ['Free',       '0 – 150',    '$0.00',  '$0',     'No cap',  'Tracking stops at 150'],
        ['Growth',     '0 – 60,000', '$0.05',  '~$3,000','$15,000', '$0.04/shipment after 60,000'],
        ['Enterprise', '60,000+',    'Custom', 'Custom', 'Custom',  'Negotiated SLA rate'],
    ];
    const smsRows = SMS_RATES.map(r => [r.region, `$${r.price.toFixed(2)} per SMS`]);

    return (
        <BlockStack gap="400">
            <Card>
                <BlockStack gap="300">
                    <Text variant="headingLg" as="h2">Shipment Pricing Overview</Text>
                    <DataTable
                        columnContentTypes={['text','text','text','text','text','text']}
                        headings={['Plan','Monthly Volume','Per Shipment','Est. Max Monthly','Billing Cap','Overage']}
                        rows={shipmentRows}
                    />
                    <BlockStack gap="050">
                        <Text variant="bodySm" tone="subdued">* Free plan stops tracking at 150 shipments — no overage charges.</Text>
                        <Text variant="bodySm" tone="subdued">** Growth billing cap is $15,000/month. Charges stop at the cap automatically.</Text>
                        <Text variant="bodySm" tone="subdued">** Billing runs every 30 days from your install date, not a calendar month.</Text>
                    </BlockStack>
                </BlockStack>
            </Card>
            <Card>
                <BlockStack gap="300">
                    <Text variant="headingLg" as="h2">SMS Notification Pricing</Text>
                    <Text variant="bodyMd" tone="subdued">
                        Available on Growth and Enterprise plans. Billed by your shop's region, combined with shipment charges in one monthly invoice.
                    </Text>
                    <DataTable
                        columnContentTypes={['text','text']}
                        headings={['Region','Price per SMS']}
                        rows={smsRows}
                    />
                </BlockStack>
            </Card>
        </BlockStack>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE TABLE
// ─────────────────────────────────────────────────────────────────────────────

function FeatureTable() {
    const planIds    = ['free', 'plan_1', 'plan_2'];
    const planNames  = { free: 'Free', plan_1: 'Growth', plan_2: 'Enterprise' };
    const planColors = { free: '#637381', plan_1: '#008060', plan_2: '#4F46E5' };

    const headerCellStyle = { textAlign:'center', padding:'10px 16px', fontWeight:600, fontSize:13, borderBottom:'2px solid #E4E5E7', whiteSpace:'nowrap' };
    const featureCellStyle = { padding:'10px 16px', fontSize:13, color:'#202223', borderBottom:'1px solid #F1F1F1', verticalAlign:'middle' };
    const checkCellStyle   = { textAlign:'center', padding:'10px 16px', borderBottom:'1px solid #F1F1F1', verticalAlign:'middle' };

    const CheckMark = () => (
        <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:'50%', background:'#E3F1EB' }}>
            <Icon source={CheckIcon} tone="success" />
        </div>
    );
    const CrossMark = () => (
        <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:'50%', background:'#F6F6F7' }}>
            <Icon source={XIcon} tone="subdued" />
        </div>
    );

    return (
        <Card>
            <BlockStack gap="0">
                <Box padding="400" paddingBlockEnd="300">
                    <Text variant="headingLg" as="h2">All Features Included</Text>
                    <Text variant="bodyMd" tone="subdued">
                        Every plan includes access to all features below. Your plan determines shipment volume and SMS availability.
                    </Text>
                </Box>
                {FEATURE_GROUPS.map((group, gi) => (
                    <div key={gi}>
                        {gi > 0 && <Divider />}
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
                                <colgroup>
                                    <col style={{ width:'52%' }} /><col style={{ width:'16%' }} />
                                    <col style={{ width:'16%' }} /><col style={{ width:'16%' }} />
                                </colgroup>
                                <thead>
                                    <tr style={{ background:'#F9FAFB' }}>
                                        <th style={{ ...headerCellStyle, textAlign:'left', paddingLeft:20 }}>
                                            <InlineStack gap="200" blockAlign="center">
                                                <span style={{ fontSize:18 }}>{group.icon}</span>
                                                <Text variant="headingSm" as="span">{group.group}</Text>
                                            </InlineStack>
                                        </th>
                                        {planIds.map(pid => (
                                            <th key={pid} style={{ ...headerCellStyle, color:planColors[pid] }}>{planNames[pid]}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.features.map((feature, fi) => (
                                        <tr key={fi} style={{ background: fi % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                            <td style={{ ...featureCellStyle, paddingLeft:20 }}>
                                                <BlockStack gap="0">
                                                    <Text variant="bodyMd">{feature.name}</Text>
                                                    {feature.note && <Text variant="bodySm" tone="subdued">{feature.note}</Text>}
                                                </BlockStack>
                                            </td>
                                            {planIds.map(pid => (
                                                <td key={pid} style={checkCellStyle}>
                                                    {feature.plans[pid] ? <CheckMark /> : <CrossMark />}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </BlockStack>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PricingPage() {
    const { shop: loaderShop } = useLoaderData();
    const shop = loaderShop || (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('shop') || '' : '');

    const [loading,              setLoading]              = useState(true);
    const [planData,             setPlanData]             = useState(null);
    const [selectedPlan,         setSelectedPlan]         = useState(null);
    const [modalOpen,            setModalOpen]            = useState(false);
    const [upgrading,            setUpgrading]            = useState(false);
    const [upgradeRequired,      setUpgradeRequired]      = useState(false);
    const [requiredPlan,         setRequiredPlan]         = useState(null);
    const [toast,                setToast]                = useState({ active:false, message:'', error:false });
    const [enterpriseModalOpen,  setEnterpriseModalOpen]  = useState(false);
    const [enterpriseSubmitting, setEnterpriseSubmitting] = useState(false);
    const [enterpriseSubmitted,  setEnterpriseSubmitted]  = useState(false);
    const [enterpriseForm,       setEnterpriseForm]       = useState({ contact_name:'', contact_email:'', monthly_volume:'', message:'' });

    const pollRef = useRef(null);
    const { getCurrentPlan, createSubscription } = usePricingService(shop);

    const showToast    = useCallback((msg, err=false) => setToast({ active:true, message:msg, error:err }), []);
    const dismissToast = useCallback(() => setToast(t => ({ ...t, active:false })), []);

    const loadCurrentPlan = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCurrentPlan();
            setPlanData(data);
            return data;
        } catch (err) {
            showToast('Failed to load plan data. Please refresh.', true);
            const fallback = {
                currentPlan:'free', subscriptionPlan:'free', subscriptionStatus:'ACTIVE',
                shipmentCount:0, isFrozen:false, cappedAmount:0, balanceUsed:0, balanceRemaining:0,
                smsAllowed:false, smsCount:0, smsCharge:0, smsRate:0, smsRegion:'',
                overage:null, estimatedTotal:0, nextBillingDate:null, trackingStopped:false,
            };
            setPlanData(fallback);
            return fallback;
        } finally {
            setLoading(false);
        }
    }, [getCurrentPlan, showToast]);

    // BUG-7 FIX: upgradeRequired resets when plan is no longer free or tracking not stopped
    useEffect(() => {
        if (!planData) return;
        if (planData.subscriptionPlan === 'free' && planData.trackingStopped) {
            setUpgradeRequired(true);
            setRequiredPlan(PLANS.find(p => p.id === 'plan_1') || null);
        } else {
            setUpgradeRequired(false);
            setRequiredPlan(null);
        }
    }, [planData]);

    // Billing callback polling + decline detection
    //
    // Shopify billing page is NOT inside the embedded iframe — it's top-level
    // admin.shopify.com. When the merchant cancels/declines, Shopify redirects the
    // browser to our returnUrl (/billingdemapp/callback) with no charge_id. Our
    // backend marks the subscription DECLINED and redirects back to the embedded
    // pricing page with ?billing_confirmed=false.
    //
    // However, sometimes the browser redirect chain breaks (CSP, iframe sandboxing,
    // or Shopify routing the cancel to /settings/apps instead). As a safety net:
    // on every page load we also check if the backend subscription is DECLINED and
    // surface the banner regardless of whether the URL param arrived.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params    = new URLSearchParams(window.location.search);
        const confirmed = params.get('billing_confirmed');

        if (confirmed !== null) {
            // Clean the URL immediately so refreshes don't re-trigger
            window.history.replaceState({}, '', window.location.pathname + '?shop=' + shop);
        }

        if (confirmed === 'true') {
            showToast('Billing approved! Activating subscription...');
            let attempts = 0;
            pollRef.current = setInterval(async () => {
                attempts++;
                try {
                    const data = await getCurrentPlan();
                    if (data.subscriptionStatus === 'ACTIVE' || attempts >= 10) {
                        clearInterval(pollRef.current);
                        setPlanData(data);
                        if (data.subscriptionStatus === 'ACTIVE') showToast('Subscription is now active!');
                    }
                } catch { clearInterval(pollRef.current); }
            }, 2000);
        } else if (confirmed === 'false') {
            // returnUrl redirect worked — show declined banner immediately
            showToast('Billing not approved. Please select a plan.', true);
            loadCurrentPlan();
        } else {
            // No billing_confirmed param — normal page load.
            // loadCurrentPlan() runs in the effect below and will detect
            // DECLINED status from the backend, which triggers DeclinedBanner
            // via the subscriptionStatus === 'DECLINED' check in the render.
        }

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { loadCurrentPlan(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectPlan = useCallback((plan) => {
        if (planRank(plan.id) < planRank(planData?.subscriptionPlan || 'free')) {
            showToast('Cannot downgrade from your current plan.', true);
            return;
        }
        setSelectedPlan(plan);
        setModalOpen(true);
    }, [planData, showToast]);

    const handleContactSales = useCallback(() => {
        setEnterpriseSubmitted(false);
        setEnterpriseForm({ contact_name:'', contact_email:'', monthly_volume:'', message:'' });
        setEnterpriseModalOpen(true);
    }, []);

    const handleEnterpriseFormChange = useCallback((field, value) => {
        setEnterpriseForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleEnterpriseSubmit = useCallback(async () => {
        if (!enterpriseForm.contact_email.trim()) { showToast('Please enter your contact email.', true); return; }
        setEnterpriseSubmitting(true);
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
            const res = await fetch(`${API_BASE}/billingdemapp/create`, {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                credentials:'include',
                body: JSON.stringify({ shop, plan_id:'plan_2', ...enterpriseForm }),
            });
            const result = await res.json().catch(() => ({}));
            if (result.success) { setEnterpriseSubmitted(true); await loadCurrentPlan(); }
            else throw new Error(result.error || 'Submission failed. Please try again.');
        } catch (err) {
            showToast(err.message || 'Failed to submit. Please try again.', true);
        } finally {
            setEnterpriseSubmitting(false);
        }
    }, [enterpriseForm, shop, showToast, loadCurrentPlan]);

    const handleConfirmUpgrade = useCallback(async () => {
        if (!selectedPlan) return;
        setUpgrading(true);
        try {
            const result = await createSubscription(selectedPlan.id);
            if (result.success && result.data?.confirmation_url) {
                showToast('Redirecting to Shopify for billing approval...');
                setTimeout(() => openExternal(result.data.confirmation_url), 800);
                return;
            }
            if (result.success) {
                showToast('Subscription updated!');
                setModalOpen(false);
                setUpgradeRequired(false);
                await loadCurrentPlan();
            } else {
                throw new Error(result.error || 'Unexpected response');
            }
        } catch (err) {
            showToast(err.message || 'Failed. Please try again.', true);
        } finally {
            setUpgrading(false);
        }
    }, [selectedPlan, createSubscription, showToast, loadCurrentPlan]);

    const subPlanObj      = PLANS.find(p => p.id === planData?.subscriptionPlan) || PLANS[0];
    const shipmentCount   = planData?.shipmentCount || 0;
    const isFrozen        = planData?.isFrozen || false;
    const isDeclined      = planData?.subscriptionStatus === 'DECLINED';
    const trackingStopped = planData?.trackingStopped || false;

    const upgradeEstimate = selectedPlan?.id === 'plan_1' && shipmentCount > 0
        ? `$${(Math.min(shipmentCount, 60000) * 0.05 + Math.max(0, shipmentCount - 60000) * 0.04).toFixed(2)}`
        : null;

    if (loading) {
        return (
            <Frame><Page>
                <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
                    <Spinner size="large" />
                </div>
            </Page></Frame>
        );
    }

    return (
        <Frame>
            <Page title="Pricing Plans" subtitle="Simple, volume-based pricing that scales with your store">
                <Layout>

                    {isFrozen && <Layout.Section><FrozenBanner /></Layout.Section>}

                    {isDeclined && !isFrozen && (
                        <Layout.Section>
                            <DeclinedBanner onResubscribe={() => { setSelectedPlan(subPlanObj); setModalOpen(true); }} />
                        </Layout.Section>
                    )}

                    {trackingStopped && !isFrozen && (
                        <Layout.Section>
                            <TrackingStoppedBanner onUpgrade={() => {
                                const growthPlan = PLANS.find(p => p.id === 'plan_1');
                                if (growthPlan) { setSelectedPlan(growthPlan); setModalOpen(true); }
                            }} />
                        </Layout.Section>
                    )}

                    {/* BUG-8 FIX: in-page sticky banner only, no modal re-open */}
                    {upgradeRequired && requiredPlan && !isFrozen && !trackingStopped && (
                        <Layout.Section>
                            <UpgradeRequiredBanner
                                shipmentCount={shipmentCount}
                                onUpgrade={() => { setSelectedPlan(requiredPlan); setModalOpen(true); }}
                            />
                        </Layout.Section>
                    )}

                    {planData && <Layout.Section><UsageDisplay planData={planData} /></Layout.Section>}
                    <Layout.Section><PricingTable /></Layout.Section>

                    <Layout.Section>
                        <Banner>
                            <BlockStack gap="150">
                                <Text variant="headingSm" fontWeight="semibold">How Pricing Works</Text>
                                <Text as="p">
                                    The Free plan tracks up to 150 shipments/month at no cost — tracking stops at the limit.
                                    The Growth plan charges $0.05 per shipment up to 60,000, then $0.04 per additional shipment.
                                    SMS notifications are billed separately. A single consolidated charge runs every 30 days from your install date.
                                </Text>
                            </BlockStack>
                        </Banner>
                    </Layout.Section>

                    <Layout.Section>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20, alignItems:'stretch' }}>
                            {PLANS.map(plan => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    subscriptionPlan={planData?.subscriptionPlan}
                                    subscriptionStatus={planData?.subscriptionStatus}
                                    shipmentCount={shipmentCount}
                                    onSelectPlan={handleSelectPlan}
                                    onContactSales={handleContactSales}
                                />
                            ))}
                        </div>
                    </Layout.Section>

                    <Layout.Section><FeatureTable /></Layout.Section>

                    <Layout.Section>
                        <Card>
                            <BlockStack gap="300" align="center">
                                <Text variant="headingMd" as="h3">Need help choosing a plan?</Text>
                                <Text variant="bodyMd" tone="subdued" alignment="center">
                                    Our team can help you find the right fit for your volume and requirements.
                                </Text>
                                <Button onClick={() => openExternal('mailto:support@lateshipment.com')}>Contact Support</Button>
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                </Layout>
            </Page>

            {/* BUG-8 FIX: onClose always closes — no re-open trap */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={`Select ${selectedPlan?.name} Plan`}
                primaryAction={{
                    content:  upgrading ? 'Processing…' : 'Confirm & Approve on Shopify',
                    onAction: handleConfirmUpgrade,
                    loading:  upgrading,
                    disabled: upgrading,
                }}
                secondaryActions={[{ content:'Cancel', onAction:() => setModalOpen(false), disabled:upgrading }]}
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        <Banner title="Plan details">
                            <List>
                                <List.Item>Plan: <strong>{selectedPlan?.name}</strong></List.Item>
                                {selectedPlan?.id === 'free' && (
                                    <List.Item>Up to 150 shipments/month — free forever</List.Item>
                                )}
                                {selectedPlan?.id === 'plan_1' && (
                                    <>
                                        <List.Item>Up to 60,000 shipments at <strong>$0.05/shipment</strong></List.Item>
                                        <List.Item>Overage: <strong>$0.04/shipment</strong> after 60,000</List.Item>
                                        <List.Item>Billing cap: <strong>$15,000/month</strong></List.Item>
                                        <List.Item>SMS notifications charged separately</List.Item>
                                        {upgradeEstimate && (
                                            <List.Item>
                                                Est. cost for your {shipmentCount.toLocaleString()} shipments: <strong>{upgradeEstimate}/month</strong>
                                            </List.Item>
                                        )}
                                    </>
                                )}
                                {selectedPlan?.id === 'plan_2' && (
                                    <List.Item>Enterprise custom pricing — our team will contact you.</List.Item>
                                )}
                            </List>
                        </Banner>
                        <Text variant="bodySm" tone="subdued">
                            You'll be redirected to Shopify to approve this subscription.
                            A single consolidated charge (shipments + SMS) is billed every 30 days from your install date.
                        </Text>
                    </BlockStack>
                </Modal.Section>
            </Modal>

            <Modal
                open={enterpriseModalOpen}
                onClose={() => { if (!enterpriseSubmitting) setEnterpriseModalOpen(false); }}
                title="Contact Sales — Enterprise Plan"
                primaryAction={enterpriseSubmitted
                    ? { content:'Close', onAction:() => setEnterpriseModalOpen(false) }
                    : { content: enterpriseSubmitting ? 'Submitting…' : 'Submit Inquiry', onAction:handleEnterpriseSubmit, loading:enterpriseSubmitting, disabled:enterpriseSubmitting }
                }
                secondaryActions={enterpriseSubmitted ? [] : [{ content:'Cancel', onAction:() => setEnterpriseModalOpen(false), disabled:enterpriseSubmitting }]}
            >
                <Modal.Section>
                    {enterpriseSubmitted ? (
                        <BlockStack gap="400">
                            <Banner tone="success" title="Inquiry received!">
                                <Text as="p">Thanks! Our sales team will contact you at <strong>{enterpriseForm.contact_email}</strong> within 1 business day.</Text>
                            </Banner>
                            <Text variant="bodyMd" tone="subdued">
                                Once pricing is agreed, you'll receive a Shopify billing approval link to activate your Enterprise plan.
                            </Text>
                        </BlockStack>
                    ) : (
                        <BlockStack gap="400">
                            <Banner tone="info">
                                <Text as="p">Enterprise plans are custom-priced based on your volume and requirements. Our team will reach out within 1 business day.</Text>
                            </Banner>
                            <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold">Your Name</Text>
                                <input type="text" value={enterpriseForm.contact_name}
                                    onChange={e => handleEnterpriseFormChange('contact_name', e.target.value)}
                                    placeholder="Jane Smith"
                                    style={{ width:'100%', padding:'8px 12px', fontSize:14, border:'1px solid #c9cccf', borderRadius:6, boxSizing:'border-box' }}
                                />
                            </BlockStack>
                            <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold">Contact Email <span style={{ color:'#d72c0d' }}>*</span></Text>
                                <input type="email" value={enterpriseForm.contact_email}
                                    onChange={e => handleEnterpriseFormChange('contact_email', e.target.value)}
                                    placeholder="jane@yourstore.com"
                                    style={{ width:'100%', padding:'8px 12px', fontSize:14, border:'1px solid #c9cccf', borderRadius:6, boxSizing:'border-box' }}
                                />
                            </BlockStack>
                            <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold">Estimated Monthly Shipments</Text>
                                <select value={enterpriseForm.monthly_volume}
                                    onChange={e => handleEnterpriseFormChange('monthly_volume', e.target.value)}
                                    style={{ width:'100%', padding:'8px 12px', fontSize:14, border:'1px solid #c9cccf', borderRadius:6, background:'white', boxSizing:'border-box' }}
                                >
                                    <option value="">Select a range…</option>
                                    <option value="60001-100000">60,001 – 100,000</option>
                                    <option value="100001-250000">100,001 – 250,000</option>
                                    <option value="250001-500000">250,001 – 500,000</option>
                                    <option value="500001+">500,001+</option>
                                </select>
                            </BlockStack>
                            <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold">Additional Notes (optional)</Text>
                                <textarea value={enterpriseForm.message}
                                    onChange={e => handleEnterpriseFormChange('message', e.target.value)}
                                    placeholder="Any specific requirements, integrations, or questions…"
                                    rows={3}
                                    style={{ width:'100%', padding:'8px 12px', fontSize:14, border:'1px solid #c9cccf', borderRadius:6, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
                                />
                            </BlockStack>
                            <Text variant="bodySm" tone="subdued">* Required. We'll only use your contact details to discuss your Enterprise plan.</Text>
                        </BlockStack>
                    )}
                </Modal.Section>
            </Modal>

            {toast.active && <Toast content={toast.message} error={toast.error} onDismiss={dismissToast} />}
        </Frame>
    );
}