import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useReferral } from '../contexts/ReferralContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { formatDistanceToNow } from 'date-fns';

interface ReferralTier {
    id: string;
    name: string;
    min_referrals: number;
    bonus_multiplier: number;
}

interface ReferralAnalytic {
    id: string;
    status: 'active' | 'inactive' | 'converted';
    last_activity: string;
    mining_contribution: number;
    conversion_date: string | null;
}

export function ReferralAnalytics() {
    const { referrals, isLoading: contextLoading } = useReferral();
    const [tiers, setTiers] = useState<ReferralTier[]>([]);
    const [analytics, setAnalytics] = useState<ReferralAnalytic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // If context is not ready, show a message
    if (contextLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Referral Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Loading referral data...</p>
                </CardContent>
            </Card>
        );
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch referral tiers
                const { data: tiersData, error: tiersError } = await supabase
                    .from('referral_tiers')
                    .select('*')
                    .order('min_referrals', { ascending: true });

                if (tiersError) throw tiersError;
                setTiers(tiersData || []);

                // Fetch referral analytics
                const { data: analyticsData, error: analyticsError } = await supabase
                    .from('referral_analytics')
                    .select('*')
                    .in('referral_id', referrals.map(r => r.id));

                if (analyticsError) throw analyticsError;
                setAnalytics(analyticsData || []);

            } catch (err) {
                console.error('Error fetching referral data:', err);
                setError('Failed to load referral data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [referrals]);

    const getCurrentTier = () => {
        const totalReferrals = referrals.length;
        return tiers.find(tier => totalReferrals >= tier.min_referrals) || tiers[0];
    };

    const getNextTier = () => {
        const currentTier = getCurrentTier();
        return tiers.find(tier => tier.min_referrals > currentTier.min_referrals);
    };

    const getConversionRate = () => {
        const converted = analytics.filter(a => a.status === 'converted').length;
        return referrals.length > 0 ? (converted / referrals.length) * 100 : 0;
    };

    const getActiveReferrals = () => {
        return analytics.filter(a => a.status === 'active').length;
    };

    if (isLoading) {
        return <div>Loading referral analytics...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    const progressToNextTier = nextTier
        ? ((referrals.length - currentTier.min_referrals) / (nextTier.min_referrals - currentTier.min_referrals)) * 100
        : 100;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Referral Tier Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Current Tier: {currentTier.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {currentTier.bonus_multiplier}x Bonus Multiplier
                                </p>
                            </div>
                            {nextTier && (
                                <div className="text-right">
                                    <p className="text-sm font-medium">Next Tier: {nextTier.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {nextTier.min_referrals - referrals.length} more referrals needed
                                    </p>
                                </div>
                            )}
                        </div>
                        <Progress value={progressToNextTier} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="referrals">Referral Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{referrals.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{getActiveReferrals()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{getConversionRate().toFixed(1)}%</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="referrals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Referral Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                        <TableHead>Mining Contribution</TableHead>
                                        <TableHead>Conversion Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.map((analytic) => (
                                        <TableRow key={analytic.id}>
                                            <TableCell>
                                                <Badge variant={
                                                    analytic.status === 'active' ? 'default' :
                                                    analytic.status === 'converted' ? 'secondary' :
                                                    'outline'
                                                }>
                                                    {analytic.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatDistanceToNow(new Date(analytic.last_activity), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>{analytic.mining_contribution.toFixed(2)} tokens</TableCell>
                                            <TableCell>
                                                {analytic.conversion_date
                                                    ? formatDistanceToNow(new Date(analytic.conversion_date), { addSuffix: true })
                                                    : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 