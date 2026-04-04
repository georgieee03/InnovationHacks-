import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync } from 'fs';

const doc = new jsPDF();
let y = 20;
const lh = 6;
const left = 20;

function title(text) { doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text(text, left, y); y += lh + 4; }
function heading(text) { doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text(text, left, y); y += lh + 2; }
function line(text) { doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.text(text, left, y); y += lh; }
function gap(n=4) { y += n; }

title('BUSINESS INSURANCE POLICY — DECLARATIONS PAGE');
gap();
line('Policy Number: BOP-2024-TX-00847291');
line('Effective Date: March 15, 2024 – March 15, 2025');
line('Named Insured: Maria\'s Bakery LLC');
line('DBA: Maria\'s Bakery');
line('Mailing Address: 2847 Wheeler Ave, Houston, TX 77004');
line('Business Description: Retail Bakery and Café');
gap();
line('INSURING COMPANY: Gulf States Mutual Insurance Co.');
gap(6);

heading('COVERAGES AND LIMITS:');
gap();
heading('Section A — General Liability');
line('  Per Occurrence Limit:              $500,000');
line('  General Aggregate Limit:           $1,000,000');
line('  Products/Completed Operations:     $500,000');
line('  Personal & Advertising Injury:     $500,000');
line('  Damage to Rented Premises:         $100,000');
line('  Medical Payments:                  $5,000');
line('  Deductible:                        $1,000');
gap();

heading('Section B — Commercial Property');
line('  Building Coverage:                 Not Covered (tenant)');
line('  Business Personal Property:        $100,000');
line('  Loss of Income:                    Not Covered');
line('  Deductible:                        $2,500');
line('  Covered Perils: Fire, lightning, windstorm, hail, explosion,');
line('  smoke, vandalism, theft, water damage (non-flood)');
gap();

heading('Section C — Workers\' Compensation');
line('  Part One (Workers Comp):           Statutory Limits — State of Texas');
line('  Part Two (Employer\'s Liability):');
line('    Each Accident:                   $100,000');
line('    Disease — Policy Limit:          $500,000');
line('    Disease — Each Employee:         $100,000');
gap();

line('ENDORSEMENTS: None');
gap();

heading('EXCLUSIONS (apply to all sections):');
line('  - Flood and surface water damage');
line('  - Earthquake and earth movement');
line('  - Equipment breakdown / mechanical failure');
line('  - Cyber liability and data breaches');
line('  - Business interruption / loss of income');
line('  - Professional liability');
line('  - Employment practices liability');
line('  - Commercial auto');
gap(6);

heading('ANNUAL PREMIUM SUMMARY:');
line('  General Liability:                 $1,420.00');
line('  Commercial Property:               $980.00');
line('  Workers\' Compensation:             $2,020.00');
line('  Policy Fees:                        $150.00');
line('  TOTAL ANNUAL PREMIUM:              $4,570.00');
line('  Monthly Installment:                $285.00');
gap(6);

line('AGENT: Robert Chen, Gulf States Insurance Agency');
line('Phone: (713) 555-0142');

mkdirSync('public/demo-policies', { recursive: true });
const buf = Buffer.from(doc.output('arraybuffer'));
writeFileSync('public/demo-policies/marias-bakery-policy.pdf', buf);
console.log('PDF generated successfully');
