'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { GraduationCap, Users, Building2, Rocket } from 'lucide-react';
import {
	type FeatureItem,
	PricingTable,
	PricingTableBody,
	PricingTableHeader,
	PricingTableHead,
	PricingTableRow,
	PricingTableCell,
	PricingTablePlan,
} from '@/components/ui/pricing-table';
import { Button } from '@/components/ui/button';

export const Pricing = () => {
	return (
		<section className="py-20 md:py-24 relative">
			<div className="container">
				{/* Header */}
				<div className="text-center mb-16">
					<h2 className="text-5xl md:text-6xl font-medium text-center tracking-tighter">
						Student-based pricing
					</h2>
					<p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5">
						Pay only for the students you analyze. All data stored locally in SQLite database for privacy and security.
					</p>
				</div>

				{/* Pricing Table */}
				<PricingTable className="mx-auto my-5 max-w-6xl">
					<PricingTableHeader>
						<PricingTableRow>
							<th />
							<th className="p-1">
								<PricingTablePlan
									name="Free Trial"
									badge="Get Started"
									price="$0"
									compareAt=""
									icon={GraduationCap}
								>
									<div className="mb-2 text-xs text-white/60">60 students • 1 month</div>
									<Button 
										variant="outline" 
										className="w-full rounded-lg border-white/15 hover:bg-white/5" 
										size="lg"
									>
										Start Free
									</Button>
								</PricingTablePlan>
							</th>
							<th className="p-1">
								<PricingTablePlan
									name="Standard"
									badge="Most Popular"
									price="$240"
									compareAt=""
									icon={Users}
									className="after:pointer-events-none after:absolute after:-inset-0.5 after:rounded-[inherit] after:bg-linear-to-b after:from-[#8C45FF]/20 after:to-transparent after:blur-[2px]"
								>
									<div className="mb-2 text-xs text-white/60">1,500 students • 1 year</div>
									<Button
										className="w-full rounded-lg border-[#A369FF]/60 bg-[#8C45FF]/80 text-white hover:bg-[#8C45FF] shadow-lg shadow-[#8C45FF]/25"
										size="lg"
									>
										Get Started
									</Button>
								</PricingTablePlan>
							</th>
							<th className="p-1">
								<PricingTablePlan
									name="Professional"
									badge="Best Value"
									price="$900"
									compareAt=""
									icon={Building2}
								>
									<div className="mb-2 text-xs text-white/60">7,000 students • 1 year</div>
									<Button 
										variant="outline" 
										className="w-full rounded-lg border-white/15 hover:bg-white/5" 
										size="lg"
									>
										Get Started
									</Button>
								</PricingTablePlan>
							</th>
							<th className="p-1">
								<PricingTablePlan
									name="Enterprise"
									badge="Custom Solution"
									price="Custom"
									compareAt=""
									icon={Rocket}
								>
									<div className="mb-2 text-xs text-white/60">Unlimited students</div>
									<Button 
										variant="outline" 
										className="w-full rounded-lg border-white/15 hover:bg-white/5" 
										size="lg"
									>
										Contact Sales
									</Button>
								</PricingTablePlan>
							</th>
						</PricingTableRow>
					</PricingTableHeader>
					<PricingTableBody>
						{FEATURES.map((feature, index) => (
							<PricingTableRow key={index}>
								<PricingTableHead>{feature.label}</PricingTableHead>
								{feature.values.map((value, index) => (
									<PricingTableCell key={index}>{value}</PricingTableCell>
								))}
							</PricingTableRow>
						))}
					</PricingTableBody>
				</PricingTable>

				{/* Bottom CTA */}
				<div className="mt-16 text-center">
					<p className="text-white/70 text-sm">
						All plans include 95% accuracy validation • AKTU format compliance • Local SQLite database • Automated Excel reports
					</p>
				</div>
			</div>
		</section>
	);
};

export const FEATURES: FeatureItem[] = [
	{
		label: 'Student Records',
		values: ['60 students', '1,500 students', '7,000 students', 'Unlimited'],
	},
	{
		label: 'Subscription Duration',
		values: ['1 month', '1 year', '1 year', 'Custom'],
	},
	{
		label: 'Local SQLite Database',
		values: [true, true, true, true],
	},
	{
		label: 'Processing Speed',
		values: ['~2s per student', '~2s per student', '~1.5s per student', '~1s per student'],
	},
	{
		label: 'SGPA Calculations',
		values: [true, true, true, true],
	},
	{
		label: 'Subject-wise Analysis',
		values: [true, true, true, true],
	},
	{
		label: 'Statistical Insights',
		values: ['Basic', 'Advanced', 'Advanced', 'Advanced + Custom'],
	},
	{
		label: 'Excel Report Generation',
		values: [true, true, true, true],
	},
	{
		label: 'Data Export Formats',
		values: ['Excel only', 'Excel, CSV', 'Excel, CSV, PDF', 'All formats + Custom'],
	},
	{
		label: 'Multiple Departments',
		values: ['1 department', 'Up to 3', 'Up to 10', 'Unlimited'],
	},
	{
		label: 'User Accounts',
		values: ['1 user', 'Up to 3 users', 'Up to 10 users', 'Unlimited users'],
	},
	{
		label: 'Historical Data Storage',
		values: ['1 month', '1 year', '3 years', 'Unlimited'],
	},
	{
		label: 'Batch Processing',
		values: [false, true, true, true],
	},
	{
		label: 'Custom Report Templates',
		values: [false, true, true, true],
	},
	{
		label: 'Data Backup',
		values: ['Manual only', 'Weekly auto-backup', 'Daily auto-backup', 'Real-time backup'],
	},
	{
		label: 'API Access',
		values: [false, false, true, true],
	},
	{
		label: 'Priority Support',
		values: ['Community', 'Email support', 'Business hours', '24/7 priority'],
	},
	{
		label: 'Training & Onboarding',
		values: ['Documentation', '1 session', '3 sessions', 'Unlimited sessions'],
	},
	{
		label: 'Dedicated Account Manager',
		values: [false, false, false, true],
	},
	{
		label: 'Custom Integrations',
		values: [false, false, false, true],
	},
	{
		label: 'White-label Option',
		values: [false, false, false, true],
	},
	{
		label: 'SLA Guarantee',
		values: [false, false, '99.5% uptime', '99.9% uptime'],
	},
];
