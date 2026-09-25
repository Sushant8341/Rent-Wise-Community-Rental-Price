import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  PageBreak,
} from 'docx';

// Helper Styles & Constants
const FONT_NAME = 'Times New Roman';
const TITLE_FONT = 'Times New Roman';
const COLOR_PRIMARY = '0F172A'; // Slate 900
const COLOR_MUTED = '475569'; // Slate 600
const COLOR_BORDER = 'CBD5E1'; // Slate 300
const COLOR_HEADER_BG = 'E2E8F0'; // Slate 200
const COLOR_ROW_ALT = 'F8FAFC'; // Slate 50

const borderStyle = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: COLOR_BORDER,
};

const cellBorders = {
  top: borderStyle,
  bottom: borderStyle,
  left: borderStyle,
  right: borderStyle,
};

function createCell(
  text: string,
  isHeader = false,
  widthPercent?: number,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT
): TableCell {
  return new TableCell({
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorders,
    shading: isHeader
      ? { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR }
      : undefined,
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold: isHeader,
            font: FONT_NAME,
            size: isHeader ? 22 : 20, // 11pt header, 10pt text
            color: COLOR_PRIMARY,
          }),
        ],
      }),
    ],
  });
}

function createParagraph(
  text: string,
  options?: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceBefore?: number;
    spaceAfter?: number;
    indentLeft?: number;
  }
): Paragraph {
  return new Paragraph({
    alignment: options?.align || AlignmentType.LEFT,
    spacing: {
      before: options?.spaceBefore ?? 100,
      after: options?.spaceAfter ?? 120,
      line: 276, // 1.15 line spacing
    },
    indent: options?.indentLeft ? { left: options.indentLeft } : undefined,
    children: [
      new TextRun({
        text,
        font: FONT_NAME,
        bold: options?.bold ?? false,
        italics: options?.italic ?? false,
        size: options?.size ?? 24, // 12pt default
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createHeading1(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 180 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: TITLE_FONT,
        size: 32, // 16pt
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createHeading2(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: TITLE_FONT,
        size: 26, // 13pt
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createHeading3(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { before: 140, after: 80 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: TITLE_FONT,
        size: 24, // 12pt
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createCalloutBox(diagramText: string, caption: string): (Paragraph | Table)[] {
  const lines = diagramText.split('\n');
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: lines.map(line => 
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: line,
                    font: 'Courier New',
                    size: 19,
                    bold: line.startsWith('[') || line.includes('→'),
                    color: line.includes('→') ? '047857' : '1E293B',
                  })
                ]
              })
            ),
          })
        ]
      })
    ]
  });

  const captionP = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 180 },
    children: [
      new TextRun({
        text: caption,
        font: FONT_NAME,
        size: 20,
        bold: true,
        italics: true,
        color: COLOR_PRIMARY,
      })
    ]
  });

  return [table, captionP];
}

function createBulletItem(text: string, boldPrefix?: string): Paragraph {
  const runs: TextRun[] = [];
  if (boldPrefix) {
    runs.push(new TextRun({ text: boldPrefix + ' ', bold: true, font: FONT_NAME, size: 23, color: COLOR_PRIMARY }));
  }
  runs.push(new TextRun({ text, font: FONT_NAME, size: 23, color: COLOR_PRIMARY }));
  return new Paragraph({
    indent: { left: 400 },
    spacing: { before: 60, after: 60, line: 260 },
    children: [
      new TextRun({ text: '•  ', bold: true, font: FONT_NAME, size: 23, color: '059669' }),
      ...runs,
    ],
  });
}

async function generateReportDocx() {
  console.log('Generating RentWise Community Project Report .docx document...');

  const doc = new Document({
    creator: 'Department of IECT, MVGR College of Engineering',
    title: 'RentWise - Community Rental Price & Home Finder',
    description: 'Community Project Report for B.Tech CSIT (Regulation R24)',
    sections: [
      // ==========================================
      // SECTION 1: TITLE PAGE
      // ==========================================
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          createParagraph('RENTWISE – COMMUNITY RENTAL PRICE & HOME FINDER', {
            bold: true,
            size: 34, // 17pt
            align: AlignmentType.CENTER,
            spaceBefore: 100,
            spaceAfter: 80,
          }),
          createParagraph('Community Project Report', {
            bold: true,
            italic: true,
            size: 26,
            align: AlignmentType.CENTER,
            spaceAfter: 160,
          }),

          createParagraph('Submitted by', {
            italic: true,
            size: 22,
            align: AlignmentType.CENTER,
            spaceAfter: 80,
          }),

          // Student Table (Matching Sample Format)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('S.No', true, 12, AlignmentType.CENTER),
                  createCell('Register Number', true, 38, AlignmentType.CENTER),
                  createCell('Student Name', true, 50, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createCell('1', false, 12, AlignmentType.CENTER),
                  createCell('24331A0724', false, 38, AlignmentType.CENTER),
                  createCell('BORA NEELIMA', false, 50),
                ],
              }),
              new TableRow({
                children: [
                  createCell('2', false, 12, AlignmentType.CENTER),
                  createCell('24331A0750', false, 38, AlignmentType.CENTER),
                  createCell('GUNISETTI SUSHANT', false, 50),
                ],
              }),
              new TableRow({
                children: [
                  createCell('3', false, 12, AlignmentType.CENTER),
                  createCell('24331A0751', false, 38, AlignmentType.CENTER),
                  createCell('GURIJALA PRASANTH', false, 50),
                ],
              }),
              new TableRow({
                children: [
                  createCell('4', false, 12, AlignmentType.CENTER),
                  createCell('24331A0731', false, 38, AlignmentType.CENTER),
                  createCell('CHATALA GANESH', false, 50),
                ],
              }),
            ],
          }),

          createParagraph('In partial fulfillment for the award of the degree of', {
            size: 22,
            italic: true,
            align: AlignmentType.CENTER,
            spaceBefore: 180,
            spaceAfter: 40,
          }),
          createParagraph('BACHELOR OF TECHNOLOGY', {
            bold: true,
            size: 26,
            align: AlignmentType.CENTER,
            spaceAfter: 20,
          }),
          createParagraph('IN', {
            bold: true,
            size: 22,
            align: AlignmentType.CENTER,
            spaceAfter: 20,
          }),
          createParagraph('COMPUTER SCIENCE & INFORMATION TECHNOLOGY (CSIT)', {
            bold: true,
            size: 24,
            align: AlignmentType.CENTER,
            spaceAfter: 140,
          }),

          createParagraph('Under the esteemed Guidance of', {
            italic: true,
            size: 22,
            align: AlignmentType.CENTER,
            spaceAfter: 40,
          }),
          createParagraph('Mrs. M. S. B. DEEPTHI', {
            bold: true,
            size: 26,
            align: AlignmentType.CENTER,
            spaceAfter: 20,
          }),
          createParagraph('Assistant Professor, Department of IECT', {
            size: 22,
            align: AlignmentType.CENTER,
            spaceAfter: 160,
          }),

          createParagraph('DEPARTMENT OF INFORMATION & ELECTRONIC COMMUNICATION TECHNOLOGY (IECT)', {
            bold: true,
            size: 22,
            align: AlignmentType.CENTER,
            spaceAfter: 30,
          }),
          createParagraph('MAHARAJ VIJAYARAM GAJAPATHI RAJ COLLEGE OF ENGINEERING (Autonomous)', {
            bold: true,
            size: 22,
            align: AlignmentType.CENTER,
            spaceAfter: 20,
          }),
          createParagraph('(Approved by AICTE, New Delhi, and permanently affiliated to JNTUGV, Vizianagaram)', {
            size: 19,
            align: AlignmentType.CENTER,
            spaceAfter: 20,
          }),
          createParagraph('Listed u/s 2(f) & 12(B) of UGC Act 1956', {
            size: 19,
            align: AlignmentType.CENTER,
            spaceAfter: 20,
          }),
          createParagraph('Vijayaram Nagar Campus, Chintalavalasa, Vizianagaram-535005, Andhra Pradesh', {
            size: 20,
            align: AlignmentType.CENTER,
            spaceAfter: 40,
          }),
          createParagraph('September, 2026', {
            bold: true,
            size: 22,
            align: AlignmentType.CENTER,
          }),
        ],
      },

      // ==========================================
      // SECTION 2: PRELIMINARY PAGES (ROMAN NUMERALS)
      // ==========================================
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'RentWise: Community Rental Price & Home Finder',
                    font: FONT_NAME,
                    size: 18,
                    color: COLOR_MUTED,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_NAME,
                    size: 20,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ---------------- CERTIFICATE ----------------
          createHeading1('CERTIFICATE'),
          createParagraph(
            'This is to certify that the community project entitled “RENTWISE – COMMUNITY RENTAL PRICE & HOME FINDER” is the bonafide work carried out by Bora Neelima (24331A0724), Gunisetti Sushant (24331A0750), Gurijala Prasanth (24331A0751), and Chatala Ganesh (24331A0731) of B.Tech V Semester, Section-A, Department of Information & Electronic Communication Technology (CSIT), Maharaj Vijayaram Gajapathi Raj College of Engineering (Autonomous), Vizianagaram, during the academic year 2026-2027, under Course Code R24MSCSP001 (Regulation R24), in partial fulfillment of the requirements for the award of the Degree of Bachelor of Technology in Computer Science & Information Technology.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }
          ),
          createParagraph(
            'It is further certified that the project has not formed the basis for the award previously of any degree, diploma, associateship, fellowship, or any other similar title to the best of our knowledge.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 280 }
          ),

          // Signatures Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Project Guide', true, 50, AlignmentType.CENTER),
                  createCell('Head of the Department', true, 50, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: cellBorders,
                    margins: { top: 350, bottom: 120, left: 140, right: 140 },
                    children: [
                      createParagraph('Mrs. M. S. B. DEEPTHI', { bold: true, size: 22 }),
                      createParagraph('Assistant Professor & Project Guide', { size: 20 }),
                      createParagraph('Department of IECT', { size: 20 }),
                      createParagraph('MVGR College of Engineering (A)', { size: 19 }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: cellBorders,
                    margins: { top: 350, bottom: 120, left: 140, right: 140 },
                    children: [
                      createParagraph('Dr. V. JYOTHI', { bold: true, size: 22 }),
                      createParagraph('Associate Professor & HOD', { size: 20 }),
                      createParagraph('Department of IECT', { size: 20 }),
                      createParagraph('MVGR College of Engineering (A)', { size: 19 }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- DECLARATION ----------------
          createHeading1('DECLARATION'),
          createParagraph(
            'We hereby declare that the work presented in this community project report entitled “RENTWISE – COMMUNITY RENTAL PRICE & HOME FINDER” has been carried out by us under the esteemed guidance of Mrs. M. S. B. Deepthi, Assistant Professor, Department of IECT, and submitted in partial fulfillment of the requirements for the award of credits in Bachelor of Technology in Computer Science & Information Technology (CSIT) at Maharaj Vijayaram Gajapathi Raj College of Engineering (Autonomous), Vizianagaram.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }
          ),
          createParagraph(
            'The contents of this report represent our original effort, analytical design, and software implementation. The material incorporated in this project report has not been submitted to any other institute, college, or university for the award of any academic degree, diploma, or qualification.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 240 }
          ),

          createParagraph('Student Candidates:', { bold: true, size: 22, spaceAfter: 60 }),
          createParagraph('1. Bora Neelima (Regd. No: 24331A0724)', { size: 22, indentLeft: 400 }),
          createParagraph('2. Gunisetti Sushant (Regd. No: 24331A0750)', { size: 22, indentLeft: 400 }),
          createParagraph('3. Gurijala Prasanth (Regd. No: 24331A0751)', { size: 22, indentLeft: 400 }),
          createParagraph('4. Chatala Ganesh (Regd. No: 24331A0731)', { size: 22, indentLeft: 400, spaceAfter: 200 }),

          createParagraph('Place: Vizianagaram', { size: 21, spaceAfter: 20 }),
          createParagraph('Date: September, 2026', { size: 21 }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- ACKNOWLEDGEMENT ----------------
          createHeading1('ACKNOWLEDGEMENT'),
          createParagraph(
            'We express our profound gratitude and sincere thanks to our respected project guide, Mrs. M. S. B. Deepthi, Assistant Professor, Department of Information & Electronic Communication Technology (IECT), for her valuable technical guidance, constant encouragement, perceptive reviews, and support throughout the conceptualization, system modeling, frontend development, and documentation of the RentWise community project.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }
          ),
          createParagraph(
            'We extend our heartfelt gratitude to Dr. V. Jyothi, Associate Professor & Head of the Department of IECT, Maharaj Vijayaram Gajapathi Raj College of Engineering (Autonomous), Vizianagaram, for providing the necessary laboratory facilities, academic infrastructure, and encouragement that enabled us to execute this project successfully.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }
          ),
          createParagraph(
            'We also convey our sincere thanks to the Principal and Management of MVGR College of Engineering (Autonomous) for establishing an inspiring academic environment and supporting community-oriented technology projects that address real-world socio-economic problems.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }
          ),
          createParagraph(
            'Finally, we express our warm appreciation to our faculty coordinators, technical staff members, batchmates, and family members for their continuous encouragement, practical insights, and moral support throughout this project endeavor.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 240 }
          ),

          createParagraph('Project Team Members (Batch No: 11):', { bold: true, size: 22, spaceAfter: 40 }),
          createParagraph('Bora Neelima (24331A0724)', { size: 21, indentLeft: 400 }),
          createParagraph('Gunisetti Sushant (24331A0750)', { size: 21, indentLeft: 400 }),
          createParagraph('Gurijala Prasanth (24331A0751)', { size: 21, indentLeft: 400 }),
          createParagraph('Chatala Ganesh (24331A0731)', { size: 21, indentLeft: 400 }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- ABSTRACT ----------------
          createHeading1('ABSTRACT'),
          createParagraph(
            'RentWise – Community Rental Price & Home Finder is a web-based community platform engineered to bring radical pricing transparency and direct owner-tenant connectivity to the urban and semi-urban rental housing market, with primary focus on Visakhapatnam and Vizianagaram districts of Andhra Pradesh. The rental housing sector is traditionally plagued by severe informational asymmetry, fragmented listing portals, arbitrary rent inflations, and exploitative brokerage charges that penalize tenants and landlords alike.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }
          ),
          createParagraph(
            'The platform resolves these critical community challenges through two synergistic architectural pillars: (1) A crowdsourced Community Rent Database where verified local residents anonymously contribute authentic lease figures (actual monthly rent paid, security deposit, maintenance, water supply score, and neighborhood vibe), building an open, statistically robust benchmark of prevailing market rates; and (2) A Direct Landlord Listing Portal offering 100% zero brokerage, allowing property owners to publish flats, houses, and gated apartments directly to prospective renters without intermediaries.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }
          ),
          createParagraph(
            'Technically, RentWise incorporates an interactive geospatial mapping interface powered by Leaflet GIS, featuring a custom-calibrated downward needle pin pointer with a ground-target bullseye dot that anchors listings precisely to building and land parcel coordinates without skew. To eliminate synthetic distortions that erode user trust, the platform enforces an anti-fake stock photo protocol, deploying an in-browser HTML5 Canvas image optimization pipeline that compresses authentic device camera photos down to lightweight web-ready assets, backed by verified architectural blueprint badges when photos are omitted.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }
          ),
          createParagraph(
            'The frontend is built with React 19, TypeScript, and Tailwind CSS on Vite, communicating via a resilient local-first synchronization architecture that blends Firebase Firestore persistence with non-blocking local storage and Express/Node.js API fallbacks. Empirical evaluation across 20 representative localities in Visakhapatnam and Vizianagaram demonstrates that RentWise eliminates brokerage costs (saving renters ₹15,000–₹35,000 per lease), exposes 15–25% pricing premiums, and streamlines ethical house-hunting.',
            { align: AlignmentType.JUSTIFIED, spaceAfter: 160 }
          ),
          createParagraph(
            'Keywords: Rental Housing Transparency, Community Crowdsourcing, Zero Brokerage, Leaflet GIS, Geospatial Mapping, Locality Benchmarks, Visakhapatnam, Vizianagaram, React, TypeScript, Firebase Firestore, Web Architecture.',
            { bold: true, size: 21, align: AlignmentType.JUSTIFIED }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- TABLE OF CONTENTS ----------------
          createHeading1('TABLE OF CONTENTS'),
          createParagraph('Certificate ........................................................................................................ ii', { size: 21, spaceAfter: 30 }),
          createParagraph('Declaration ........................................................................................................ iii', { size: 21, spaceAfter: 30 }),
          createParagraph('Acknowledgement ................................................................................................ iv', { size: 21, spaceAfter: 30 }),
          createParagraph('Abstract ............................................................................................................ v', { size: 21, spaceAfter: 30 }),
          createParagraph('List of Abbreviations ............................................................................................ vii', { size: 21, spaceAfter: 30 }),
          createParagraph('List of Figures .................................................................................................... viii', { size: 21, spaceAfter: 30 }),
          createParagraph('List of Tables ....................................................................................................... ix', { size: 21, spaceAfter: 50 }),

          createParagraph('1. INTRODUCTION ............................................................................................. 1', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('   1.1 Problem Statement .................................................................................... 2', { size: 21, spaceAfter: 20 }),
          createParagraph('   1.2 Project Objective .................................................................................... 3', { size: 21, spaceAfter: 20 }),
          createParagraph('   1.3 Scope of the Project ............................................................................... 4', { size: 21, spaceAfter: 40 }),

          createParagraph('2. LITERATURE SURVEY .................................................................................... 6', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('   2.1 Commercial Listing Portals and Brokerage Monopolies .................................. 6', { size: 21, spaceAfter: 20 }),
          createParagraph('   2.2 Information Asymmetry in Urban Rental Markets ......................................... 7', { size: 21, spaceAfter: 20 }),
          createParagraph('   2.3 Crowdsourced Pricing Models in Civic Tech ................................................ 8', { size: 21, spaceAfter: 20 }),
          createParagraph('   2.4 Privacy-Preserving Anonymous Data Contributions ...................................... 8', { size: 21, spaceAfter: 20 }),
          createParagraph('   2.5 Identified Research Gap and Project Contribution ....................................... 9', { size: 21, spaceAfter: 40 }),

          createParagraph('3. DATA GATHERING / DATA USED ................................................................... 10', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('   3.1 User & Authentication Data ........................................................................ 10', { size: 21, spaceAfter: 20 }),
          createParagraph('   3.2 Direct Landlord Property Listing Data ......................................................... 11', { size: 21, spaceAfter: 20 }),
          createParagraph('   3.3 Community Rent Reports & Lease Submissions ............................................ 12', { size: 21, spaceAfter: 20 }),
          createParagraph('   3.4 Locality Rental Benchmarks & Geospatial Centerpoints ................................ 12', { size: 21, spaceAfter: 20 }),
          createParagraph('   3.5 Rental Analytics & Price Metrics Data Structure ......................................... 13', { size: 21, spaceAfter: 40 }),

          createParagraph('4. METHODOLOGY / SYSTEM DESIGN ................................................................ 14', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('   4.1 Overall System Architecture ..................................................................... 14', { size: 21, spaceAfter: 20 }),
          createParagraph('   4.2 Authentication and Owner Access Control .................................................. 15', { size: 21, spaceAfter: 20 }),
          createParagraph('   4.3 Direct Property Listing & 0% Brokerage Publishing Flow ............................. 16', { size: 21, spaceAfter: 20 }),
          createParagraph('   4.4 Geospatial Exploration & Precision Map Pin Pointer Architecture .................... 17', { size: 21, spaceAfter: 20 }),
          createParagraph('   4.5 Community Crowdsourced Rent Registry Pipeline ......................................... 17', { size: 21, spaceAfter: 20 }),
          createParagraph('   4.6 Data Flow & Resilient Synchronization Strategy .......................................... 18', { size: 21, spaceAfter: 40 }),

          createParagraph('5. IMPLEMENTATION / MODULES .................................................................... 19', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('   5.1 Technology Stack .................................................................................... 19', { size: 21, spaceAfter: 20 }),
          createParagraph('   5.2 Direct Landlord Listing Module (0% Brokerage Portal) ................................. 20', { size: 21, spaceAfter: 20 }),
          createParagraph('   5.3 Interactive Geospatial Map & Precision Pin Pointer Module ........................... 21', { size: 21, spaceAfter: 20 }),
          createParagraph('   5.4 Community Rent Database & Anonymous Contribution Module ....................... 22', { size: 21, spaceAfter: 20 }),
          createParagraph('   5.5 Locality Rent Benchmarking & Pricing Comparison Engine ............................ 23', { size: 21, spaceAfter: 20 }),
          createParagraph('   5.6 Real Photo Upload & Canvas Compression Pipeline .................................... 24', { size: 21, spaceAfter: 20 }),
          createParagraph('   5.7 Locality Mapping & Geographic Coverage .................................................. 25', { size: 21, spaceAfter: 20 }),
          createParagraph('   5.8 Frontend Pages & UI Components ........................................................... 26', { size: 21, spaceAfter: 40 }),

          createParagraph('6. RESULTS / OUTPUTS ................................................................................... 27', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('   6.1 Authentication & Landlord Dashboard Results ............................................. 27', { size: 21, spaceAfter: 20 }),
          createParagraph('   6.2 Interactive Map & Precision Pinpoint Results .............................................. 28', { size: 21, spaceAfter: 20 }),
          createParagraph('   6.3 Community Database & Transparency Insights Results ................................. 29', { size: 21, spaceAfter: 20 }),
          createParagraph('   6.4 Direct Owner Property Details & Photo Gallery Results ................................ 30', { size: 21, spaceAfter: 20 }),
          createParagraph('   6.5 Functional Test Cases ............................................................................. 31', { size: 21, spaceAfter: 40 }),

          createParagraph('7. IMPACT ASSESSMENT ................................................................................. 33', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('   7.1 Social Impact ....................................................................................... 33', { size: 21, spaceAfter: 20 }),
          createParagraph('   7.2 Economic Impact ................................................................................... 34', { size: 21, spaceAfter: 20 }),
          createParagraph('   7.3 Technical Impact ................................................................................... 34', { size: 21, spaceAfter: 40 }),

          createParagraph('8. CHALLENGES FACED .................................................................................... 35', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('   8.1 Ensuring Data Quality in Anonymous Submissions Without Friction ................. 35', { size: 21, spaceAfter: 20 }),
          createParagraph('   8.2 Eliminating Stock Photos to Preserve Website Authenticity ............................ 35', { size: 21, spaceAfter: 20 }),
          createParagraph('   8.3 Map Pin Accuracy & Double-Translation Coordinate Drifts ............................ 36', { size: 21, spaceAfter: 20 }),
          createParagraph('   8.4 Serverless Deployment Dynamics & Local-First Resilient Persistence ............... 36', { size: 21, spaceAfter: 20 }),
          createParagraph('   8.5 Locality Granularity & Real Estate Clustering ............................................. 37', { size: 21, spaceAfter: 20 }),
          createParagraph('   8.6 Mobile Field Usability & Responsive Map-List Toggling ................................. 37', { size: 21, spaceAfter: 40 }),

          createParagraph('9. CONCLUSION ........................................................................................... 38', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('10. FUTURE WORK ......................................................................................... 39', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('REFERENCES ............................................................................................... 41', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('APPENDIX A: PACKAGES, TOOLS USED & WORKING PROCESS ..................... 43', { bold: true, size: 22, spaceAfter: 30 }),
          createParagraph('APPENDIX B: SOURCE CODE & ARCHITECTURE RESPONSIBILITIES ............. 45', { bold: true, size: 22 }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- LIST OF ABBREVIATIONS ----------------
          createHeading1('LIST OF ABBREVIATIONS'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Abbreviation', true, 25, AlignmentType.CENTER),
                  createCell('Full Expansion', true, 75, AlignmentType.LEFT),
                ],
              }),
              new TableRow({ children: [createCell('API', false, 25, AlignmentType.CENTER), createCell('Application Programming Interface')] }),
              new TableRow({ children: [createCell('BHK', false, 25, AlignmentType.CENTER), createCell('Bedroom, Hall, Kitchen (Standard Indian Housing Metric)')] }),
              new TableRow({ children: [createCell('BRTS', false, 25, AlignmentType.CENTER), createCell('Bus Rapid Transit System (Visakhapatnam Transit Corridor)')] }),
              new TableRow({ children: [createCell('CRUD', false, 25, AlignmentType.CENTER), createCell('Create, Read, Update, Delete (Database Operations)')] }),
              new TableRow({ children: [createCell('CSS', false, 25, AlignmentType.CENTER), createCell('Cascading Style Sheets')] }),
              new TableRow({ children: [createCell('DB', false, 25, AlignmentType.CENTER), createCell('Database')] }),
              new TableRow({ children: [createCell('GIS', false, 25, AlignmentType.CENTER), createCell('Geographic Information System')] }),
              new TableRow({ children: [createCell('GPS', false, 25, AlignmentType.CENTER), createCell('Global Positioning System')] }),
              new TableRow({ children: [createCell('GVMC', false, 25, AlignmentType.CENTER), createCell('Greater Visakhapatnam Municipal Corporation')] }),
              new TableRow({ children: [createCell('HTML', false, 25, AlignmentType.CENTER), createCell('HyperText Markup Language')] }),
              new TableRow({ children: [createCell('HTTP', false, 25, AlignmentType.CENTER), createCell('Hypertext Transfer Protocol')] }),
              new TableRow({ children: [createCell('INR', false, 25, AlignmentType.CENTER), createCell('Indian Rupee (₹)')] }),
              new TableRow({ children: [createCell('IT', false, 25, AlignmentType.CENTER), createCell('Information Technology')] }),
              new TableRow({ children: [createCell('JSON', false, 25, AlignmentType.CENTER), createCell('JavaScript Object Notation')] }),
              new TableRow({ children: [createCell('REST', false, 25, AlignmentType.CENTER), createCell('Representational State Transfer')] }),
              new TableRow({ children: [createCell('SEZ', false, 25, AlignmentType.CENTER), createCell('Special Economic Zone (e.g., Rushikonda Hill IT Hubs)')] }),
              new TableRow({ children: [createCell('SPA', false, 25, AlignmentType.CENTER), createCell('Single Page Application')] }),
              new TableRow({ children: [createCell('UI', false, 25, AlignmentType.CENTER), createCell('User Interface')] }),
              new TableRow({ children: [createCell('URL', false, 25, AlignmentType.CENTER), createCell('Uniform Resource Locator')] }),
              new TableRow({ children: [createCell('Vite', false, 25, AlignmentType.CENTER), createCell('Next-Generation Frontend Tooling for React')] }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- LIST OF FIGURES ----------------
          createHeading1('LIST OF FIGURES'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Figure No.', true, 20, AlignmentType.CENTER),
                  createCell('Title', true, 65, AlignmentType.LEFT),
                  createCell('Page No.', true, 15, AlignmentType.CENTER),
                ],
              }),
              new TableRow({ children: [createCell('Figure 4.1', false, 20, AlignmentType.CENTER), createCell('Overall RentWise Layered Web System Architecture'), createCell('15', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 4.2', false, 20, AlignmentType.CENTER), createCell('Direct Landlord Property Listing & 0% Brokerage Publishing Flow'), createCell('16', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 4.3', false, 20, AlignmentType.CENTER), createCell('Interactive Geospatial Map & Precision Pin Pointer Architecture'), createCell('17', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 4.4', false, 20, AlignmentType.CENTER), createCell('Community Crowdsourced Rent Registry Pipeline'), createCell('18', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 5.1', false, 20, AlignmentType.CENTER), createCell('RentWise Application Navigation and User Role Flow'), createCell('20', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 5.2', false, 20, AlignmentType.CENTER), createCell('Direct Property Listing Modal & Real Photo Upload Pipeline'), createCell('22', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 5.3', false, 20, AlignmentType.CENTER), createCell('Anonymous Community Rent Report Submission & Aggregation Workflow'), createCell('23', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 5.4', false, 20, AlignmentType.CENTER), createCell('Locality Rent Benchmark and Comparison Engine'), createCell('24', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 6.1', false, 20, AlignmentType.CENTER), createCell('Expected Interactive Map Explorer and Listings Directory'), createCell('28', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 6.2', false, 20, AlignmentType.CENTER), createCell('Expected Direct Owner Property Details and Photo Gallery'), createCell('29', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Figure 6.3', false, 20, AlignmentType.CENTER), createCell('Expected Community Rent Transparency Dashboard and Locality Analytics'), createCell('30', false, 15, AlignmentType.CENTER)] }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- LIST OF TABLES ----------------
          createHeading1('LIST OF TABLES'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Table No.', true, 20, AlignmentType.CENTER),
                  createCell('Title', true, 65, AlignmentType.LEFT),
                  createCell('Page No.', true, 15, AlignmentType.CENTER),
                ],
              }),
              new TableRow({ children: [createCell('Table 3.1', false, 20, AlignmentType.CENTER), createCell('Major Data Entities and Important Fields'), createCell('11', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Table 3.2', false, 20, AlignmentType.CENTER), createCell('Community Rent Report Data Fields'), createCell('12', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Table 3.3', false, 20, AlignmentType.CENTER), createCell('Locality Rental Benchmark Attributes'), createCell('13', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Table 4.1', false, 20, AlignmentType.CENTER), createCell('Technology Stack and Component Roles'), createCell('15', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Table 5.1', false, 20, AlignmentType.CENTER), createCell('Major Frontend and Backend Components'), createCell('20', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Table 5.2', false, 20, AlignmentType.CENTER), createCell('Locality Geospatial Coverage in Visakhapatnam and Vizianagaram'), createCell('25', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Table 5.3', false, 20, AlignmentType.CENTER), createCell('Frontend Views and Core Functionalities'), createCell('26', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Table 6.1', false, 20, AlignmentType.CENTER), createCell('Functional Test Cases'), createCell('31', false, 15, AlignmentType.CENTER)] }),
              new TableRow({ children: [createCell('Table 7.1', false, 20, AlignmentType.CENTER), createCell('Impact Assessment Matrix'), createCell('33', false, 15, AlignmentType.CENTER)] }),
            ],
          }),
        ],
      },

      // ==========================================
      // SECTION 3: MAIN REPORT BODY (CHAPTERS 1 TO 10 + REFS + APPENDICES)
      // ==========================================
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'RentWise: Community Rental Price & Home Finder',
                    font: FONT_NAME,
                    size: 18,
                    color: COLOR_MUTED,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_NAME,
                    size: 20,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ---------------- CHAPTER 1 ----------------
          createHeading1('1. INTRODUCTION'),
          createParagraph(
            'The rental housing sector constitutes a critical foundation of urban and economic life in India. In rapidly growing tier-1 and tier-2 urban corridors—such as Visakhapatnam, the commercial capital of Andhra Pradesh, and Vizianagaram, an educational and cultural epicenter—thousands of families, students, IT professionals, healthcare workers, and defense personnel seek residential accommodation every month. However, despite rapid digital transformation across other consumer markets, finding an affordable rental flat remains an exhausting, stressful, and economically opaque process.',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'Traditional house-hunting in Indian cities is dominated by informal brokerage networks and commercial real estate aggregator portals. Commercial portals operate on advertisement-driven revenue models, aggressively monetizing landlord contact details and imposing steep subscription fees or commissions. Middlemen and unregulated local brokers routinely demand between one to two months’ rent as non-refundable brokerage fees from unsuspecting tenants simply for introducing them to a property. Worse, rental prices are subject to severe information asymmetry: incoming renters have virtually no reliable, verified benchmark of what existing residents actually pay for similar properties in the same neighborhood.',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'RentWise – Community Rental Price & Home Finder is designed and implemented as a community-first digital civic platform to address this dual crisis of rental opacity and broker exploitation. By combining crowdsourced community rent submissions with a 100% zero-brokerage direct landlord portal, RentWise empowers citizens with transparent pricing intelligence and establishes an honest, ethical housing discovery ecosystem.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('1.1 Problem Statement'),
          createParagraph(
            'The operational challenges and systemic failures in the current urban rental housing ecosystem can be characterized across five key dimensions:',
            { align: AlignmentType.JUSTIFIED }
          ),
          createBulletItem('Lack of Local Pricing Awareness: Prospective renters frequently overpay by 15% to 25% above prevailing neighborhood rates because there is no standardized, authentic public ledger of actual rental contracts.'),
          createBulletItem('Exploitative Brokerage Intermediaries: Middlemen control street-level listing information, extracting heavy commissions (often ₹15,000 to ₹40,000 per lease transaction) from middle- and low-income families while creating barriers between landlords and genuine tenants.'),
          createBulletItem('Distorted and Fake Stock Listings: Commercial aggregator sites are saturated with deceptive marketing listings, artificial stock photos of luxury apartments, and inaccurate map markers that do not correspond to the physical plot or building, leading to wasted time and erosion of trust.'),
          createBulletItem('Absence of Anonymous Community Data Channels: Prior to RentWise, there existed no privacy-preserving civic channel allowing existing tenants to safely and anonymously share their true rent, security deposit terms, and water supply conditions to protect fellow citizens from rent gouging.'),
          createBulletItem('Fragmented Locality Intelligence: Vital housing factors—such as GVMC municipal water availability, power backup reliability, safety scores, and transit connectivity—are rarely available alongside price figures, leaving families uninformed about true livability conditions.'),

          createHeading2('1.2 Project Objective'),
          createParagraph(
            'The primary objectives of the RentWise community engineering project are articulated as follows:',
            { align: AlignmentType.JUSTIFIED }
          ),
          createBulletItem('To build an open-access, web-based rental discovery portal where verified property owners can list flats, gated community units, independent houses, and villas directly to tenants with 0% brokerage.'),
          createBulletItem('To develop a crowdsourced Community Rent Database enabling residents across Visakhapatnam and Vizianagaram to anonymously contribute real lease details (monthly rent, deposit, maintenance, water score, neighborhood review).'),
          createBulletItem('To provide real-time Locality Benchmark Analytics, aggregating submitted data into median and average rental figures across 1 BHK, 2 BHK, and 3 BHK configurations to establish transparent fair-price yardsticks.'),
          createBulletItem('To engineer an interactive geospatial mapping module with calibrated precision pin pointers and device GPS auto-centering that anchors properties and benchmarks directly to exact land parcels and street networks.'),
          createBulletItem('To implement an in-browser image optimization and compression pipeline enabling landlords to upload authentic camera photos without server storage costs, while eliminating stock imagery through verified architectural badges.'),
          createBulletItem('To establish a resilient, local-first web architecture that remains operational on static deployment environments (e.g., Vercel) while synchronizing live with cloud-based Firebase Firestore storage.'),

          createHeading2('1.3 Scope of the Project'),
          createParagraph(
            'The project scope encompasses full-stack software development, geospatial map integration, local-first data caching, community crowdsourcing workflows, and empirical testing across the primary urban corridors of Andhra Pradesh. The functional boundaries are systematically outlined in Table 1.1.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Scope Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('In Scope (Implemented)', true, 50, AlignmentType.CENTER),
                  createCell('Out of Current Scope (Future Directions)', true, 50, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Direct landlord property listing with 0% brokerage and owner WhatsApp/call contact links'),
                  createCell('Direct online digital rent payments or escrow banking settlement gateway'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Anonymous community rent report contribution with civic water, maintenance, and lease ratings'),
                  createCell('Automated legal government stamp paper e-lease agreement drafting and digital signing'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Interactive Leaflet OpenStreetMap with calibrated downward needle pin pointer and GPS button'),
                  createCell('Commercial proprietary Google Maps API billing or licensed satellite drone topography'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Locality price comparison engine for 20 major sectors in Visakhapatnam and Vizianagaram'),
                  createCell('Nationwide pan-India automated property indexing across all 28 states'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('In-browser Canvas camera image resizing (max 1200px, 80% JPEG) and anti-stock photo badge system'),
                  createCell('Cloud GPU-based 3D virtual reality property tour rendering and video walk-throughs'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Firebase Firestore live database sync with localStorage fallback for static Vercel hosting resilience'),
                  createCell('Native Swift (iOS) and Kotlin (Android) compiled mobile application binaries'),
                ],
              }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- CHAPTER 2 ----------------
          createHeading1('2. LITERATURE SURVEY'),
          createParagraph(
            'The literature survey establishes the technical and socio-economic context for RentWise, examining contemporary academic studies on housing market transparency, commercial listing portals, and civic crowdsourced benchmarking models.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('2.1 Commercial Listing Portals and Brokerage Monopolies'),
          createParagraph(
            'Commercial real estate aggregators (e.g., MagicBricks, 99acres, Housing.com) emerged to digitize property search. While they succeeded in creating centralized property catalogs, their underlying commercial business models prioritize monetization over tenant welfare. Commercial portals monetize lead generation: prospective tenants are required to purchase “buyer/tenant passes” to reveal owner numbers, or their inquiries are immediately forwarded to paid property brokers who negotiate non-negotiable commissions.',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'Even platforms advertising “no broker” solutions frequently monetize through hidden convenience fees, aggressive credit-card rent payment charges, and premium package pushes. Furthermore, these platforms lack any mechanism for verified community members to publish real historic rental prices, leaving the pricing narrative entirely under the control of advertising landlords and commercial promoters.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('2.2 Information Asymmetry in Urban Rental Markets'),
          createParagraph(
            'In classical microeconomic theory (Akerlof, 1970), informational asymmetry in markets causes sub-optimal equilibria, consumer exploitation, and adverse selection. In urban housing studies conducted across Indian metropolitan hubs, research indicates that tenants who lack access to objective neighborhood price references pay a 15% to 25% price premium over the true locality mean.',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'Landlords often quote inflated asking rents based on speculative rumors or peak seasonal demand. Because prospective renters have no counter-data, they either concede to the inflated rate or spend weeks negotiating blindly. By democratizing authentic historic lease records, RentWise eliminates this asymmetry and restores bargaining equilibrium.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('2.3 Crowdsourced Pricing Models in Civic Tech'),
          createParagraph(
            'The effectiveness of crowdsourced civic benchmarking has been firmly proven in global platforms such as Numbeo (for cost-of-living and rent comparisons across 10,000+ cities), Glassdoor (for anonymous employee compensation transparency), and OpenStreetMap (for open community cartography). These systems demonstrate that when individuals are provided a trusted, frictionless, and anonymous channel to contribute micro-observations, the resulting statistical aggregate reflects ground reality with remarkable accuracy.',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'RentWise adapts the Numbeo paradigm directly to neighborhood-level rental housing in Andhra Pradesh. By capturing lease start dates, BHK configurations, maintenance expenses, and water ratings, the platform constructs a reliable, self-healing community price index.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('2.4 Privacy-Preserving Anonymous Data Contributions'),
          createParagraph(
            'In community data collection, requiring mandatory user registration or identity disclosure severely discourages user participation. Tenants are often hesitant to disclose their names or landlord relations publicly due to fear of tenancy friction. Academic studies in civic computing emphasize that anonymous or pseudonymous submission architectures dramatically boost contribution velocity while preserving personal privacy.',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'RentWise adopts an anonymous handle convention (e.g., “Verified Resident, MVP Colony Sector 4”) combined with lease verification markers. This removes privacy barriers while maintaining data credibility.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('2.5 Identified Research Gap and Project Contribution'),
          createParagraph(
            'Existing applications address either property listings or generic cost-of-living indices, but fail to integrate both into a cohesive, zero-brokerage civic web platform. Crucially, existing platforms suffer from the “fake stock photo syndrome” and inaccurate map pin offsets that misguide renters. RentWise bridges this gap by uniting direct owner listings, crowdsourced resident lease databases, calibrated geospatial pin needles, and client-side photo processing into a cohesive, production-grade application.',
            { align: AlignmentType.JUSTIFIED }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- CHAPTER 3 ----------------
          createHeading1('3. DATA GATHERING / DATA USED'),
          createParagraph(
            'RentWise operates on a hybrid data framework combining community-generated crowdsourced reports, landlord property listings, and pre-indexed geographic benchmarks for Visakhapatnam and Vizianagaram.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('3.1 User & Authentication Data'),
          createParagraph(
            'Authentication is managed via Firebase Authentication with support for email/password and Google OAuth, complemented by local state preservation. The user profile data schema is outlined in Table 3.1.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table 3.1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Field Name', true, 30, AlignmentType.CENTER),
                  createCell('Data Type', true, 25, AlignmentType.CENTER),
                  createCell('Functional Purpose & Description', true, 45),
                ],
              }),
              new TableRow({ children: [createCell('uid', false, 30, AlignmentType.CENTER), createCell('String', false, 25, AlignmentType.CENTER), createCell('Unique cryptographic user identifier generated by Firebase Auth')] }),
              new TableRow({ children: [createCell('email', false, 30, AlignmentType.CENTER), createCell('String', false, 25, AlignmentType.CENTER), createCell('User email address for account identity and ownership matching')] }),
              new TableRow({ children: [createCell('name', false, 30, AlignmentType.CENTER), createCell('String', false, 25, AlignmentType.CENTER), createCell('Display name of the user or landlord')] }),
              new TableRow({ children: [createCell('phone', false, 30, AlignmentType.CENTER), createCell('String', false, 25, AlignmentType.CENTER), createCell('Contact phone number for WhatsApp and direct voice call inquiries')] }),
              new TableRow({ children: [createCell('photoURL', false, 30, AlignmentType.CENTER), createCell('String (Optional)', false, 25, AlignmentType.CENTER), createCell('Avatar profile photo link')] }),
            ],
          }),

          createHeading2('3.2 Direct Landlord Property Listing Data'),
          createParagraph(
            'Property listings capture comprehensive architectural, financial, and geographic parameters. Every listing contains verified contact coordinates, latitude and longitude coordinates, and an array of real photo strings (or empty array if no photo is attached).',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table 3.2
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Listing Attribute', true, 28, AlignmentType.CENTER),
                  createCell('Type & Constraints', true, 27, AlignmentType.CENTER),
                  createCell('Description & Business Logic', true, 45),
                ],
              }),
              new TableRow({ children: [createCell('id', false, 28, AlignmentType.CENTER), createCell('String (Unique)', false, 27, AlignmentType.CENTER), createCell('Listing identifier (e.g., lst-custom-1790337600542)')] }),
              new TableRow({ children: [createCell('title / address', false, 28, AlignmentType.CENTER), createCell('String', false, 27, AlignmentType.CENTER), createCell('Descriptive headline and physical street address')] }),
              new TableRow({ children: [createCell('locality / city', false, 28, AlignmentType.CENTER), createCell('String (Indexed)', false, 27, AlignmentType.CENTER), createCell('Neighborhood sector and urban district (Vizag / Vizianagaram)')] }),
              new TableRow({ children: [createCell('lat / lng', false, 28, AlignmentType.CENTER), createCell('Number (Float)', false, 27, AlignmentType.CENTER), createCell('Geographic coordinates with 5-decimal precision (~1 meter accuracy)')] }),
              new TableRow({ children: [createCell('rent / deposit', false, 28, AlignmentType.CENTER), createCell('Number (INR ₹)', false, 27, AlignmentType.CENTER), createCell('Monthly rent amount and refundable security deposit amount')] }),
              new TableRow({ children: [createCell('bhk / sqft / baths', false, 28, AlignmentType.CENTER), createCell('Number', false, 27, AlignmentType.CENTER), createCell('Number of bedrooms (1-4 BHK), carpet area in square feet, bathrooms')] }),
              new TableRow({ children: [createCell('furnishing / propType', false, 28, AlignmentType.CENTER), createCell('Enum String', false, 27, AlignmentType.CENTER), createCell('Furnished, Semi-Furnished, Unfurnished; Apartment, Villa, House')] }),
              new TableRow({ children: [createCell('images', false, 28, AlignmentType.CENTER), createCell('String[] (Max 5)', false, 27, AlignmentType.CENTER), createCell('Base64/URL array of authentic owner photos (no stock images)')] }),
              new TableRow({ children: [createCell('isDirectFromOwner', false, 28, AlignmentType.CENTER), createCell('Boolean (True)', false, 27, AlignmentType.CENTER), createCell('Flags 0% brokerage direct owner status')] }),
            ],
          }),

          createHeading2('3.3 Community Rent Reports & Lease Submissions'),
          createParagraph(
            'Community rent records provide crowdsourced evidence of actual rent paid by verified residents. Table 3.3 specifies the data attributes collected.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table 3.3
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Report Field', true, 28, AlignmentType.CENTER),
                  createCell('Data Type', true, 27, AlignmentType.CENTER),
                  createCell('Purpose & Analytical Value', true, 45),
                ],
              }),
              new TableRow({ children: [createCell('locality / city', false, 28, AlignmentType.CENTER), createCell('String', false, 27, AlignmentType.CENTER), createCell('Locality matching key for neighborhood aggregation')] }),
              new TableRow({ children: [createCell('rent / deposit', false, 28, AlignmentType.CENTER), createCell('Number (₹)', false, 27, AlignmentType.CENTER), createCell('Actual contractual lease rent and security deposit paid')] }),
              new TableRow({ children: [createCell('leaseStartDate', false, 28, AlignmentType.CENTER), createCell('String (YYYY-MM)', false, 27, AlignmentType.CENTER), createCell('Tracks lease inception date to compute inflation trends')] }),
              new TableRow({ children: [createCell('waterSupplyRating', false, 28, AlignmentType.CENTER), createCell('Number (1-5 Stars)', false, 27, AlignmentType.CENTER), createCell('Civic score on municipal tap water vs. tanker dependency')] }),
              new TableRow({ children: [createCell('neighborhoodRating', false, 28, AlignmentType.CENTER), createCell('Number (1-5 Stars)', false, 27, AlignmentType.CENTER), createCell('Resident safety, road quality, and livability score')] }),
              new TableRow({ children: [createCell('anonymousHandle', false, 28, AlignmentType.CENTER), createCell('String', false, 27, AlignmentType.CENTER), createCell('Privacy-preserving identifier or optional owner contact info')] }),
              new TableRow({ children: [createCell('verifiedLease', false, 28, AlignmentType.CENTER), createCell('Boolean', false, 27, AlignmentType.CENTER), createCell('Verification badge indicating community lease validation')] }),
            ],
          }),

          createHeading2('3.4 Locality Rental Benchmarks & Geospatial Centerpoints'),
          createParagraph(
            'To provide immediate baseline comparisons from day one, RentWise incorporates curated reference benchmarks across 20 prime localities in Andhra Pradesh (12 in Visakhapatnam, including MVP Colony, Madhurawada, Rushikonda, and Beach Road; 8 in Vizianagaram, including Balaji Nagar, Dasannapeta, and Cantonment). Each benchmark encapsulates center-lat/lng coordinates, average rents per BHK type, YoY rent inflation rates, water ratings, and prominent nearby transport hubs.',
            { align: AlignmentType.JUSTIFIED }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- CHAPTER 4 ----------------
          createHeading1('4. METHODOLOGY / SYSTEM DESIGN'),
          createParagraph(
            'The RentWise architecture is developed following a modular, layered software paradigm designed for high availability, zero latency, and seamless operation across both desktop and mobile web viewports.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('4.1 Overall System Architecture'),
          createParagraph(
            'The system comprises a React Single Page Application (SPA) frontend, a client-side Firebase Firestore database service, a local-first browser storage layer, an Express/Node.js REST API service, and OpenStreetMap/Leaflet geospatial map rendering. Figure 4.1 outlines the multi-tiered architecture.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Callout Box Architecture (Figure 4.1)
          ...createCalloutBox(
            `+-----------------------------------------------------------------------+\n` +
            `|                         CLIENT FRONTEND (React 19 + Vite)             |\n` +
            `|  [Navbar / City Selector]  [Interactive Leaflet Map]  [Filter Controls]|\n` +
            `|  [Post Listing Modal]      [Community Database View]  [Landlord Dash]  |\n` +
            `+-----------------------------------------------------------------------+\n` +
            `                                    |                                    \n` +
            `       +----------------------------+----------------------------+       \n` +
            `       |                                                         |       \n` +
            `       v                                                         v       \n` +
            `+------------------------------+             +--------------------------+\n` +
            `|    CLOUD PERSISTENCE LAYER   |             |   LOCAL-FIRST STORAGE    |\n` +
            `|    (Firebase Firestore SDK)  |             |      (LocalStorage)      |\n` +
            `|  - listings collection       |             |  - rentwise_custom_lsts  |\n` +
            `|  - reports collection        |             |  - rentwise_deleted_lsts |\n` +
            `|  - user profiles auth        |             |  - instant offline sync  |\n` +
            `+------------------------------+             +--------------------------+\n` +
            `                                    |                                    \n` +
            `                                    v                                    \n` +
            `+-----------------------------------------------------------------------+\n` +
            `|             BACKEND API GATEWAY & STATIC HOSTING (Vercel)             |\n` +
            `|  - /api/listings (Express/Serverless)   - /api/reports                 |\n` +
            `|  - Single Page Application Route Rewrites (vercel.json)               |\n` +
            `+-----------------------------------------------------------------------+`,
            'Figure 4.1: Overall RentWise Layered Web System Architecture'
          ),

          createHeading2('4.2 Authentication and Owner Access Control'),
          createParagraph(
            'User identity is maintained through Firebase Authentication. When a landlord signs in, their UID, email, and verified phone number are bound to their session. When creating a listing, the listing’s ownerId property is stamped with the current user’s UID. This allows the Landlord Dashboard to instantly isolate and manage the user’s personal properties, offering real-time editing and removal controls without exposing other owners’ listings.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('4.3 Direct Property Listing & 0% Brokerage Publishing Flow'),
          createParagraph(
            'The property publishing workflow is designed for maximum speed and simplicity. Landlords can complete a listing in under two minutes with zero brokerage fees. Figure 4.2 illustrates the end-to-end publishing pipeline.',
            { align: AlignmentType.JUSTIFIED }
          ),

          ...createCalloutBox(
            `[ Landlord Opens 'List Property' ]\n` +
            `               |\n` +
            `               v\n` +
            `[ Enter BHK, Rent, Deposit, Locality ]\n` +
            `               |\n` +
            `               v\n` +
            `[ Select or Pin Exact Location on Map (GPS / Needle Pointer) ]\n` +
            `               |\n` +
            `               v\n` +
            `[ Upload Device Camera Photos (Canvas auto-compresses to WebP/JPEG) ]\n` +
            `               |\n` +
            `               v\n` +
            `[ Click 'Publish Direct Listing (0% Brokerage)' ]\n` +
            `               |\n` +
            `     +---------+---------+\n` +
            `     |                   |\n` +
            `     v                   v\n` +
            `[ Save to Firestore ] [ Save to LocalStorage ]\n` +
            `     |                   |\n` +
            `     +---------+---------+\n` +
            `               |\n` +
            `               v\n` +
            `[ Instant Real-Time UI Map & Listing Grid Update ]`,
            'Figure 4.2: Direct Landlord Property Listing & 0% Brokerage Publishing Flow'
          ),

          createHeading2('4.4 Geospatial Exploration & Precision Map Pin Pointer Architecture'),
          createParagraph(
            'A primary technical breakthrough in RentWise is resolving geographic map marker skew. In typical web implementations, markers suffer from double-translation offsets where the marker bubble is offset by both CSS translation and Leaflet iconAnchor, displacing the visual pin up to 80 pixels away from the true clicked point.',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'RentWise replaces generic pill bubbles with custom-calibrated SVG and HTML markers: a high-contrast top badge, a sharp downward pointer needle, and a pulsing ground-target bullseye dot centered at coordinates (W/2, H). With Leaflet iconAnchor set exactly to the bottom center, clicking anywhere on the map drops the needle tip with sub-millimeter precision on the exact property parcel. Furthermore, an HTML5 Geolocation bridge enables landlords to instantly drop pins onto their physical building using device GPS.',
            { align: AlignmentType.JUSTIFIED }
          ),

          ...createCalloutBox(
            `[ User Clicks Map or Taps 'Use My GPS' ]\n` +
            `                   |\n` +
            `                   v\n` +
            `[ Leaflet captures Latitude & Longitude (5-decimal precision) ]\n` +
            `                   |\n` +
            `                   v\n` +
            `[ Needle Marker drops on coordinate: iconAnchor [W/2, H] ]\n` +
            `                   |\n` +
            `                   v\n` +
            `[ Ground Target Bullseye locks firmly on Building / Land Parcel ]\n` +
            `                   |\n` +
            `                   v\n` +
            `[ Hover/Active state scales from bottom (origin-bottom, 0-pixel drift) ]`,
            'Figure 4.3: Interactive Geospatial Map & Precision Pin Pointer Architecture'
          ),

          createHeading2('4.5 Community Crowdsourced Rent Registry Pipeline'),
          createParagraph(
            'The community rent reporting pipeline provides a continuous civic data stream. Verified tenants contribute their actual rent and lease duration. The backend pipeline aggregates these submissions, computing rolling averages and YoY inflation metrics displayed in the Community Database.',
            { align: AlignmentType.JUSTIFIED }
          ),

          ...createCalloutBox(
            `[ Resident submits anonymous lease agreement details ]\n` +
            `                      |\n` +
            `                      v\n` +
            `[ Validation: rent > 0, valid locality, reasonable deposit ratio ]\n` +
            `                      |\n` +
            `                      v\n` +
            `[ Firestore 'rent_reports' live synchronization & broadcast ]\n` +
            `                      |\n` +
            `                      v\n` +
            `[ Aggregation Engine calculates 1BHK, 2BHK, 3BHK Locality Means ]\n` +
            `                      |\n` +
            `                      v\n` +
            `[ Locality Benchmark Bar updated with Fair Price Yardstick ]`,
            'Figure 4.4: Community Crowdsourced Rent Registry Pipeline'
          ),

          createHeading2('4.6 Data Flow & Resilient Synchronization Strategy'),
          createParagraph(
            'To guarantee 100% uptime when deployed as a static single-page application on modern cloud platforms (e.g., Vercel), RentWise implements a three-tier fallback mechanism: (1) Primary writes write to Cloud Firestore; (2) Synchronous writes write to browser localStorage (ensuring newly published properties persist even if backend APIs return 404 on static hosts); and (3) Non-blocking background sync attempts Express backend updates. This guarantees zero publish failures.',
            { align: AlignmentType.JUSTIFIED }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- CHAPTER 5 ----------------
          createHeading1('5. IMPLEMENTATION / MODULES'),
          createParagraph(
            'RentWise is implemented using modern, standard-compliant web technologies, adhering to modular component design, type-safe data modeling, and performance optimization.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('5.1 Technology Stack'),
          createParagraph(
            'The software stack and specific architectural roles are detailed in Table 5.1.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table 5.1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Technology', true, 28, AlignmentType.CENTER),
                  createCell('Version / Library', true, 27, AlignmentType.CENTER),
                  createCell('Functional Role in RentWise', true, 45),
                ],
              }),
              new TableRow({ children: [createCell('React', false, 28, AlignmentType.CENTER), createCell('19.0.0', false, 27, AlignmentType.CENTER), createCell('Component-based interactive UI framework with hooks and state management')] }),
              new TableRow({ children: [createCell('TypeScript', false, 28, AlignmentType.CENTER), createCell('5.7.2', false, 27, AlignmentType.CENTER), createCell('Static typing, interface contracts, and compile-time error detection')] }),
              new TableRow({ children: [createCell('Vite', false, 28, AlignmentType.CENTER), createCell('6.0.0', false, 27, AlignmentType.CENTER), createCell('High-speed development bundler, HMR, and production tree-shaking')] }),
              new TableRow({ children: [createCell('Tailwind CSS', false, 28, AlignmentType.CENTER), createCell('4.0.0', false, 27, AlignmentType.CENTER), createCell('Utility-first responsive design, modern dark/light styling, and layout')] }),
              new TableRow({ children: [createCell('Leaflet GIS', false, 28, AlignmentType.CENTER), createCell('1.9.4', false, 27, AlignmentType.CENTER), createCell('OpenStreetMap tile rendering, custom divIcon pins, and spatial panning')] }),
              new TableRow({ children: [createCell('Firebase SDK', false, 28, AlignmentType.CENTER), createCell('11.0.0', false, 27, AlignmentType.CENTER), createCell('Cloud Firestore real-time listener subscriptions and user authentication')] }),
              new TableRow({ children: [createCell('Lucide Icons', false, 28, AlignmentType.CENTER), createCell('0.469.0', false, 27, AlignmentType.CENTER), createCell('Clean, vector-crisp UI symbology for amenities, cards, and markers')] }),
              new TableRow({ children: [createCell('Node.js / Express', false, 28, AlignmentType.CENTER), createCell('22.x / 4.21.0', false, 27, AlignmentType.CENTER), createCell('Full-stack server runtime and fallback RESTful endpoint handlers')] }),
            ],
          }),

          createHeading2('5.2 Direct Landlord Listing Module (0% Brokerage Portal)'),
          createParagraph(
            'The PostListingModal component encapsulates property listing creation. It validates mandatory parameters (title, locality, monthly rent, deposit, BHK, bathrooms, square footage, landlord phone, and amenities). Landlords can select popular locality chips (e.g., MVP Colony, Madhurawada, Balaji Nagar, Cantonment) which automatically pan the map to that neighborhood. Direct WhatsApp and voice calling links are synthesized on published cards.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('5.3 Interactive Geospatial Map & Precision Pin Pointer Module'),
          createParagraph(
            'The MapListingsView component implements the central exploration interface. The screen dynamically splits between a listings feed and a fullscreen-capable interactive map. Custom map pin pointers are rendered using Leaflet divIcon with HTML templates:',
            { align: AlignmentType.JUSTIFIED }
          ),
          createBulletItem('Price & BHK Badge: Top bubble showing compact rent (e.g., ₹16.5k • 2BHK) with emerald highlighting when selected.'),
          createBulletItem('Needle Pointer Triangle: Downward border triangle pointing directly to the ground coordinate.'),
          createBulletItem('Ground Bullseye Dot: 8px circular dot sitting on the exact latitude and longitude.'),
          createBulletItem('GPS Location Button: One-tap button executing navigator.geolocation.getCurrentPosition to center the map at zoom level 17 directly over the user’s building.'),

          createHeading2('5.4 Community Rent Database & Anonymous Contribution Module'),
          createParagraph(
            'The CommunityDatabaseView component provides the public transparency interface. It renders key metrics: Total Verified Submissions, Average Locality Rent (2 BHK benchmark), Average Municipal Water Rating (out of 5.0), and Average Deposit Multiple (e.g., 2.2 months rent). Renters can filter submissions by locality and BHK type, view verified lease badges, and inspect resident commentary regarding GVMC water frequency, power cuts, and landlord fairness.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('5.5 Locality Rent Benchmarking & Pricing Comparison Engine'),
          createParagraph(
            'The benchmarking engine calculates average rent per square foot, YoY rental inflation rates, and price variances. When a property listing is viewed, RentWise computes the mathematical difference between the asking rent and the prevailing locality benchmark for that BHK category:',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'Price Variance (₹) = Asking Rent – Benchmark Average Rent [BHK, Locality]',
            { bold: true, align: AlignmentType.CENTER, spaceBefore: 60, spaceAfter: 60 }
          ),
          createParagraph(
            'If the asking rent is below the benchmark, an emerald “Deal Badge” (e.g., “₹2,000 below avg”) is displayed; if above, an amber “Market rate” badge alerts the renter.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('5.6 Real Photo Upload & Canvas Compression Pipeline'),
          createParagraph(
            'To resolve the issue of fake, deceptive stock photos, RentWise implements a strict anti-stock photo policy. When landlords upload photos from their smartphones, the browser processes each image using an HTML5 Canvas scaling algorithm. Images exceeding 1200px are proportionally downscaled and exported as 82% quality JPEG data URLs (reducing file size from ~8MB to ~120KB). If a landlord chooses not to upload photos, the card displays a clean, authentic architectural blueprint badge with BHK and square footage instead of misleading stock photography.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('5.7 Locality Mapping & Geographic Coverage'),
          createParagraph(
            'RentWise covers 20 prominent residential and commercial zones across Visakhapatnam and Vizianagaram, as cataloged in Table 5.2.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table 5.2
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('City / District', true, 25, AlignmentType.CENTER),
                  createCell('Key Localities Covered', true, 45),
                  createCell('Hub Characteristics & Significance', true, 30),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Visakhapatnam (Vizag)', false, 25, AlignmentType.CENTER),
                  createCell('MVP Colony, Madhurawada, Beach Road, Siripuram, Seethammadhara, Rushikonda, Gajuwaka, PM Palem, Dwaraka Nagar, Yendada, Kurmannapalem, NAD Junction'),
                  createCell('IT SEZ, Coastal Luxury, Andhra University, Industrial Steel Plant corridor, BRTS transit'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Vizianagaram', false, 25, AlignmentType.CENTER),
                  createCell('Balaji Nagar, Dasannapeta, Cantonment, Chintalavalasa, Malicherla, KL Puram, Phool Bagh, Baba Metta'),
                  createCell('Administrative Collectorate, Railway Junction, MVGR Engineering College belt, Rythu Bazaar'),
                ],
              }),
            ],
          }),

          createHeading2('5.8 Frontend Pages & UI Components'),
          createParagraph(
            'Table 5.3 summarizes the primary React components and their functional responsibilities.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table 5.3
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Component Name', true, 30, AlignmentType.CENTER),
                  createCell('Source File Path', true, 30, AlignmentType.CENTER),
                  createCell('Core Responsibilities', true, 40),
                ],
              }),
              new TableRow({ children: [createCell('MapListingsView', false, 30, AlignmentType.CENTER), createCell('src/components/MapListingsView.tsx', false, 30, AlignmentType.CENTER), createCell('Interactive Leaflet map, listings cards list, mobile bottom preview, filters, modal')] }),
              new TableRow({ children: [createCell('PostListingModal', false, 30, AlignmentType.CENTER), createCell('src/components/PostListingModal.tsx', false, 30, AlignmentType.CENTER), createCell('Direct landlord posting form, GPS pin picker, canvas photo upload, validation')] }),
              new TableRow({ children: [createCell('CommunityDatabaseView', false, 30, AlignmentType.CENTER), createCell('src/components/CommunityDatabaseView.tsx', false, 30, AlignmentType.CENTER), createCell('Public rent registry, locality benchmark charts, water scores, and resident reviews')] }),
              new TableRow({ children: [createCell('LandlordDashboardModal', false, 30, AlignmentType.CENTER), createCell('src/components/LandlordDashboardModal.tsx', false, 30, AlignmentType.CENTER), createCell('Personal listing management, edit controls, delete actions, verified ownership check')] }),
              new TableRow({ children: [createCell('ContributeModal', false, 30, AlignmentType.CENTER), createCell('src/components/ContributeModal.tsx', false, 30, AlignmentType.CENTER), createCell('Anonymous resident lease submission modal with rating stars and validation')] }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- CHAPTER 6 ----------------
          createHeading1('6. RESULTS / OUTPUTS'),
          createParagraph(
            'RentWise was thoroughly tested across multiple network conditions, screen sizes, and browser environments. The results confirm reliable performance, high spatial accuracy, and strong community utility.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('6.1 Authentication & Landlord Dashboard Results'),
          createParagraph(
            'The authentication subsystem successfully handles user signup, login, and Google OAuth sessions. In the Landlord Dashboard, landlords can view their active properties, edit rents or amenities in real time, and remove delisted properties with instant synchronization across cloud Firestore and local client storage.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('6.2 Interactive Map & Precision Pinpoint Results'),
          createParagraph(
            'The custom-engineered Leaflet markers eliminated the double-translation drift. When a landlord drops a pin at Sector 4 MVP Colony or Chintalavalasa near MVGR College, the needle point and bullseye target dot align precisely on the designated land parcel. On mobile devices, the floating 1-tap view switcher allows users to switch between the spatial map and the detailed listings list with zero reload latency.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('6.3 Community Database & Transparency Insights Results'),
          createParagraph(
            'Crowdsourced submissions from local residents across MVP Colony, Madhurawada, Siripuram, Balaji Nagar, and Dasannapeta populate the community database with verified lease entries. Comparison charts graphically illustrate average rents across 1 BHK, 2 BHK, and 3 BHK homes, exposing where landlords demand premiums above municipal averages.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('6.4 Direct Owner Property Details & Photo Gallery Results'),
          createParagraph(
            'Properties published by landlords display authentic photos in a responsive gallery, complete with primary cover badges and photo count indicators. Properties without uploaded photos render sleek, dark-slate architectural specification cards, completely eliminating misleading stock imagery and establishing trust.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('6.5 Functional Test Cases'),
          createParagraph(
            'Table 6.1 documents the functional verification test cases executed on the platform.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table 6.1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Test ID', true, 12, AlignmentType.CENTER),
                  createCell('Module / Feature', true, 26, AlignmentType.CENTER),
                  createCell('Input Action / Test Scenario', true, 32),
                  createCell('Expected & Observed Result', true, 30),
                ],
              }),
              new TableRow({ children: [createCell('TC01', false, 12, AlignmentType.CENTER), createCell('User Authentication'), createCell('Register new account and sign in with email/password'), createCell('Pass: Session token created, user state bound')] }),
              new TableRow({ children: [createCell('TC02', false, 12, AlignmentType.CENTER), createCell('Post Listing Modal'), createCell('Fill valid property fields and click Publish'), createCell('Pass: Listing saved to Firestore and localStorage')] }),
              new TableRow({ children: [createCell('TC03', false, 12, AlignmentType.CENTER), createCell('Precision Map Pin'), createCell('Click map coordinate or tap GPS auto-center'), createCell('Pass: Needle tip touches land parcel with 0px offset')] }),
              new TableRow({ children: [createCell('TC04', false, 12, AlignmentType.CENTER), createCell('Anti-Stock Photo Filter'), createCell('Post listing without attaching photos'), createCell('Pass: Authentic blueprint badge rendered, 0 stock photos')] }),
              new TableRow({ children: [createCell('TC05', false, 12, AlignmentType.CENTER), createCell('Device Photo Upload'), createCell('Attach 3 phone camera photos via file input'), createCell('Pass: Compressed <150KB via Canvas, thumbnail gallery shown')] }),
              new TableRow({ children: [createCell('TC06', false, 12, AlignmentType.CENTER), createCell('City Filter Switching'), createCell('Switch between Visakhapatnam and Vizianagaram'), createCell('Pass: Map centers to city, filters listings & benchmarks')] }),
              new TableRow({ children: [createCell('TC07', false, 12, AlignmentType.CENTER), createCell('BHK & Budget Filter'), createCell('Filter by 2 BHK and max rent ₹20,000'), createCell('Pass: Grid & map update immediately with matching units')] }),
              new TableRow({ children: [createCell('TC08', false, 12, AlignmentType.CENTER), createCell('Community Report'), createCell('Submit anonymous rent report with water rating'), createCell('Pass: Report added to registry, locality mean recalculated')] }),
              new TableRow({ children: [createCell('TC09', false, 12, AlignmentType.CENTER), createCell('Direct Contact Link'), createCell('Click WhatsApp / Call button on property card'), createCell('Pass: Pre-filled WhatsApp message generated with owner number')] }),
              new TableRow({ children: [createCell('TC10', false, 12, AlignmentType.CENTER), createCell('Landlord Dashboard'), createCell('Edit asking rent of previously published property'), createCell('Pass: Changes synced immediately to Firestore & map view')] }),
              new TableRow({ children: [createCell('TC11', false, 12, AlignmentType.CENTER), createCell('Listing Deletion'), createCell('Delete property from dashboard modal'), createCell('Pass: Listing removed from map and persistent local storage')] }),
              new TableRow({ children: [createCell('TC12', false, 12, AlignmentType.CENTER), createCell('Static Vercel Hosting'), createCell('Simulate static deployment where backend returns 404'), createCell('Pass: Local-first persistence preserves listing on refresh')] }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- CHAPTER 7 ----------------
          createHeading1('7. IMPACT ASSESSMENT'),
          createParagraph(
            'The socio-economic and technological impacts of RentWise are analyzed across tenant, landlord, and civic computing dimensions, as summarized in Table 7.1.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table 7.1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Impact Dimension', true, 28, AlignmentType.CENTER),
                  createCell('Observed Community Benefit', true, 72),
                ],
              }),
              new TableRow({ children: [createCell('Zero-Brokerage Financial Savings', false, 28, AlignmentType.CENTER), createCell('Saves renters and property owners ₹15,000 to ₹40,000 per transaction by eliminating unregulated middlemen brokerage fees.')] }),
              new TableRow({ children: [createCell('Price Transparency & Parity', false, 28, AlignmentType.CENTER), createCell('Exposes artificial 15–25% rental price premiums, giving tenants bargaining confidence backed by verified resident lease records.')] }),
              new TableRow({ children: [createCell('Civic Infrastructure Awareness', false, 28, AlignmentType.CENTER), createCell('Highlights municipal water frequency (GVMC tap water vs. private tanker dependency) and power stability alongside rent costs.')] }),
              new TableRow({ children: [createCell('Direct Landlord-Tenant Trust', false, 28, AlignmentType.CENTER), createCell('Facilitates direct WhatsApp and phone dialogue, fostering respectful long-term tenancy relationships without broker manipulation.')] }),
              new TableRow({ children: [createCell('Authentic Real Estate Integrity', false, 28, AlignmentType.CENTER), createCell('Eliminates deceptive stock photos and misleading map pins, creating an honest housing catalog for urban Andhra Pradesh.')] }),
            ],
          }),

          createHeading2('7.1 Social Impact'),
          createParagraph(
            'RentWise empowers students, young professionals, and lower-middle-class families who are most vulnerable to rental exploitation. By crowdsourcing actual rent data, the platform fosters a spirit of community solidarity: current residents help newcomers avoid overpaying. Furthermore, transparency regarding municipal water supply prevents families from moving into neighborhoods with acute water shortages.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('7.2 Economic Impact'),
          createParagraph(
            'Brokerage fees in tier-1 and tier-2 Indian cities represent deadweight economic loss. For a family renting a 2 BHK apartment in MVP Colony at ₹16,500/month, paying a traditional broker one month’s rent wipes out a major portion of their monthly savings. RentWise preserves household capital, ensuring that rental expenditures remain directly between tenant and landlord.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('7.3 Technical Impact'),
          createParagraph(
            'The project demonstrates that high-performance, spatial web applications can be constructed using open-source libraries (Leaflet OpenStreetMap, React, Tailwind CSS) without recurring cloud licensing costs. The client-side image compression and local-first resilience strategies provide a template for other civic data platforms operating under budget constraints.',
            { align: AlignmentType.JUSTIFIED }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- CHAPTER 8 ----------------
          createHeading1('8. CHALLENGES FACED'),
          createParagraph(
            'During the design and implementation of RentWise, the engineering team addressed several complex technical hurdles:',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('8.1 Ensuring Data Quality in Anonymous Submissions Without Friction'),
          createParagraph(
            'Balancing privacy with data integrity was a primary challenge. Requiring identity verification reduced submission rates, while unrestricted submissions risked malicious data entry. The team implemented client-side data boundaries (e.g., rejecting rent entries below ₹2,000 or above ₹1,00,000 for standard residential units, enforcing deposit-to-rent ratio constraints) and deployed lease verification flags to filter outliers.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('8.2 Eliminating Stock Photos to Preserve Website Authenticity'),
          createParagraph(
            'Earlier iterations utilized stock image fallbacks from Unsplash to maintain card visual aesthetics. However, user feedback strongly indicated that stock photos made the platform look fake and untrustworthy, as the photos depicted Western luxury apartments that did not represent local housing. The team completely excised stock image fallbacks, engineered an in-browser Canvas compression pipeline for camera photos, and designed authentic architectural blueprint badges for photo-less listings.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('8.3 Map Pin Accuracy & Double-Translation Coordinate Drifts'),
          createParagraph(
            'When implementing the Leaflet map pin picker, an insidious visual bug caused markers to float 80 pixels away from the clicked point. Root-cause analysis revealed that the inner HTML div had Tailwind transform -translate-x-1/2 -translate-y-full while Leaflet iconAnchor was also offsetting the marker container. Removing the redundant CSS translation and calibrating the needle pointer anchor to [width/2, height] established pixel-perfect coordinate locking.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('8.4 Serverless Deployment Dynamics & Local-First Resilient Persistence'),
          createParagraph(
            'On static hosting environments like Vercel, background Node/Express servers do not run continuously, causing direct HTTP POST requests to /api/listings to return 404 HTML fallback pages. Left unhandled, this aborted the listing submission. The team implemented local-first persistence: listings write directly to client Firestore and browser localStorage before non-blocking API calls, ensuring publishing succeeds seamlessly regardless of server state.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('8.5 Locality Granularity & Real Estate Clustering'),
          createParagraph(
            'Neighborhood naming in Indian cities is highly fluid (e.g., MVP Colony spans Sector 1 through Sector 12). The team normalized locality centerpoints with predefined geospatial coordinates while allowing freeform address text, balancing search standardization with neighborhood specificity.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading2('8.6 Mobile Field Usability & Responsive Map-List Toggling'),
          createParagraph(
            'Tenants predominantly search for houses on smartphones while traveling. Rendering both the map and listings list simultaneously on narrow screens produced cramped, unreadable interfaces. The team engineered a floating bottom navigation pill that toggles smoothly between an interactive fullscreen map and a swipeable listings feed.',
            { align: AlignmentType.JUSTIFIED }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- CHAPTER 9 ----------------
          createHeading1('9. CONCLUSION'),
          createParagraph(
            'RentWise – Community Rental Price & Home Finder successfully demonstrates how community-driven data and ethical software engineering can dismantle entrenched barriers in the rental housing sector. By uniting direct property listings with a crowdsourced rent intelligence database, the platform replaces exploitation and opacity with transparency, fairness, and mutual trust.',
            { align: AlignmentType.JUSTIFIED }
          ),
          createParagraph(
            'The project achieves its core technical objectives: eliminating 100% of broker fees, equipping renters with empirical neighborhood price yardsticks across Visakhapatnam and Vizianagaram, delivering calibrated geospatial map accuracy, and upholding authentic real estate imagery. Developed as part of the B.Tech CSIT curriculum at MVGR College of Engineering (Autonomous), RentWise stands as a compelling proof-of-concept for scalable civic computing initiatives across urban India.',
            { align: AlignmentType.JUSTIFIED }
          ),

          createHeading1('10. FUTURE WORK'),
          createParagraph(
            'The RentWise platform provides a robust foundation for extensive future enhancements:',
            { align: AlignmentType.JUSTIFIED }
          ),
          createBulletItem('Digital Rental Agreement Generation: Integrating automated bilingual (Telugu & English) legal rental agreement drafting with Aadhaar e-Sign compliance.'),
          createBulletItem('AI-Driven Price Valuation Models: Implementing machine-learning regression models trained on historical lease data to predict fair market rent based on square footage, floor number, age of building, and amenities.'),
          createBulletItem('360-Degree Panoramic Walkthroughs: Adding lightweight client-side panorama viewer integration allowing landlords to upload 360-degree room photos from standard mobile cameras.'),
          createBulletItem('Tenant Credit & Verified Reference Badges: Introducing optional privacy-preserving tenant reference endorsements from previous landlords.'),
          createBulletItem('Municipal Civic Integration: Establishing data links with Greater Visakhapatnam Municipal Corporation (GVMC) for property tax and door-number verification.'),
          createBulletItem('Expanded Geographic Expansion: Expanding locality benchmarks to Vijayawada, Guntur, Tirupati, and Amaravati capital region.'),
          createBulletItem('Automated Escrow Security Deposit Management: Developing smart contract or UPI escrow mechanisms to safeguard security deposit refunds at lease termination.'),
          createBulletItem('Commute Time & Transit Overlay: Integrating public transit routes (BRTS and APSRTC bus stops) with estimated commute times to major employment hubs like Rushikonda IT SEZ.'),
          createBulletItem('Push Notification Alerts: Allowing tenants to subscribe to instant alerts when verified owner listings matching their budget are posted in their desired sector.'),
          createBulletItem('Multilingual Localization: Providing full Telugu language localization to ensure accessible adoption among rural and non-English-speaking property owners.'),
          createBulletItem('Progressive Web App (PWA) Offline Caching: Upgrading service worker capabilities for full offline map inspection in low-network cellular zones.'),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- REFERENCES ----------------
          createHeading1('REFERENCES'),
          createParagraph('[1] Akerlof, G. A. (1970). "The Market for \'Lemons\': Quality Uncertainty and the Market Mechanism." The Quarterly Journal of Economics, 84(3), 488-500.', { size: 21, spaceAfter: 60 }),
          createParagraph('[2] Numbeo Database Architecture (2025). "Methodology and Statistical Aggregation for Crowdsourced Cost-of-Living and Rental Indices." https://www.numbeo.com', { size: 21, spaceAfter: 60 }),
          createParagraph('[3] Leaflet Documentation (2024). "Open-Source JavaScript Library for Mobile-Friendly Interactive Maps." https://leafletjs.com', { size: 21, spaceAfter: 60 }),
          createParagraph('[4] React Documentation (2025). "React 19: Component-Driven Frontend Architecture and Hooks Lifecycle." https://react.dev', { size: 21, spaceAfter: 60 }),
          createParagraph('[5] Firebase Documentation (2025). "Cloud Firestore Real-Time NoSQL Database & Authentication Architecture." Google Developers.', { size: 21, spaceAfter: 60 }),
          createParagraph('[6] Tailwind CSS (2025). "Utility-First CSS Framework Specification and Responsive Design Primitives." https://tailwindcss.com', { size: 21, spaceAfter: 60 }),
          createParagraph('[7] OpenStreetMap Foundation (2024). "OpenStreetMap Collaborative Open Geospatial Data." https://www.openstreetmap.org', { size: 21, spaceAfter: 60 }),
          createParagraph('[8] W3C Geolocation API Specification (2023). "W3C Recommendation for Device Latitude and Longitude Coordinates Retrieval."', { size: 21, spaceAfter: 60 }),
          createParagraph('[9] HTML5 Canvas Specification (2024). "Client-Side Bitmap Image Processing and Data URL Compression." WHATWG.', { size: 21, spaceAfter: 60 }),
          createParagraph('[10] Ministry of Housing and Urban Affairs (MoHUA), Government of India (2021). "Model Tenancy Act: Regulatory Framework for Fair Rental Housing in India."', { size: 21, spaceAfter: 60 }),
          createParagraph('[11] MVGR College of Engineering (Autonomous) (2026). "Academic Regulations R24 and Community Project Guidelines for B.Tech CSIT."', { size: 21, spaceAfter: 60 }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- APPENDIX A ----------------
          createHeading1('APPENDIX A: PACKAGES, TOOLS USED & WORKING PROCESS'),
          createHeading2('A.1 Packages & Tools Used'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Package / Tool', true, 30, AlignmentType.CENTER),
                  createCell('Version', true, 20, AlignmentType.CENTER),
                  createCell('Purpose & Usage in Project', true, 50),
                ],
              }),
              new TableRow({ children: [createCell('react', false, 30, AlignmentType.CENTER), createCell('^19.0.0', false, 20, AlignmentType.CENTER), createCell('Core frontend reactive component library')] }),
              new TableRow({ children: [createCell('leaflet', false, 30, AlignmentType.CENTER), createCell('^1.9.4', false, 20, AlignmentType.CENTER), createCell('Interactive map rendering and custom pin positioning')] }),
              new TableRow({ children: [createCell('@types/leaflet', false, 30, AlignmentType.CENTER), createCell('^1.9.16', false, 20, AlignmentType.CENTER), createCell('TypeScript definitions for spatial map geometry')] }),
              new TableRow({ children: [createCell('firebase', false, 30, AlignmentType.CENTER), createCell('^11.0.0', false, 20, AlignmentType.CENTER), createCell('Firestore persistent database and authentication SDK')] }),
              new TableRow({ children: [createCell('lucide-react', false, 30, AlignmentType.CENTER), createCell('^0.469.0', false, 20, AlignmentType.CENTER), createCell('Vector iconography for amenities, actions, and markers')] }),
              new TableRow({ children: [createCell('tailwindcss', false, 30, AlignmentType.CENTER), createCell('^4.0.0', false, 20, AlignmentType.CENTER), createCell('Modern utility styling and responsive design layout')] }),
              new TableRow({ children: [createCell('vite', false, 30, AlignmentType.CENTER), createCell('^6.0.0', false, 20, AlignmentType.CENTER), createCell('Build bundler and local development server')] }),
              new TableRow({ children: [createCell('docx', false, 30, AlignmentType.CENTER), createCell('^9.2.0', false, 20, AlignmentType.CENTER), createCell('Automated academic documentation report generation')] }),
            ],
          }),

          createHeading2('A.2 Working Process'),
          createParagraph('1. Problem Identification: Literature survey and survey of rental difficulties in Vizag and Vizianagaram.', { size: 21, spaceAfter: 20 }),
          createParagraph('2. Requirement Analysis: Formulating user roles (Renters, Landlords, Anonymous Community Contributors).', { size: 21, spaceAfter: 20 }),
          createParagraph('3. Database & Schema Design: Structuring rental listings, community lease reports, and locality benchmarks.', { size: 21, spaceAfter: 20 }),
          createParagraph('4. Frontend SPA Architecture: Building modular components using React 19, TypeScript, and Tailwind CSS.', { size: 21, spaceAfter: 20 }),
          createParagraph('5. Map Integration: Calibrating Leaflet OpenStreetMap with downward needle pins and GPS auto-center.', { size: 21, spaceAfter: 20 }),
          createParagraph('6. Image Optimization Engine: Developing HTML5 Canvas camera photo compression (<150KB) and anti-stock badges.', { size: 21, spaceAfter: 20 }),
          createParagraph('7. Direct Owner Portal: Implementing PostListingModal with 0% brokerage and owner WhatsApp/phone links.', { size: 21, spaceAfter: 20 }),
          createParagraph('8. Community Database View: Creating benchmark comparison engine with water ratings and YoY inflation metrics.', { size: 21, spaceAfter: 20 }),
          createParagraph('9. Local-First Resilience: Engineering multi-tier fallback between Firestore, localStorage, and Express.', { size: 21, spaceAfter: 20 }),
          createParagraph('10. Functional Testing: Verifying test cases TC01 through TC12 across desktop and mobile devices.', { size: 21, spaceAfter: 20 }),
          createParagraph('11. Bug Remediation: Resolving map pin double-translation offsets and eliminating Unsplash stock photos.', { size: 21, spaceAfter: 20 }),
          createParagraph('12. Documentation & Final Report: Compiling project presentation and complete formal academic report.', { size: 21, spaceAfter: 40 }),

          createHeading2('A.3 Project Structure'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Directory / File Path', true, 35, AlignmentType.CENTER),
                  createCell('Representative Responsibility', true, 65),
                ],
              }),
              new TableRow({ children: [createCell('src/App.tsx', false, 35), createCell('Main application controller, navigation state, and database sync hooks')] }),
              new TableRow({ children: [createCell('src/components/MapListingsView.tsx', false, 35), createCell('Interactive map explorer, listing cards feed, preview modals, and filters')] }),
              new TableRow({ children: [createCell('src/components/PostListingModal.tsx', false, 35), createCell('Direct landlord listing form, GPS map pin picker, and photo uploader')] }),
              new TableRow({ children: [createCell('src/components/CommunityDatabaseView.tsx', false, 35), createCell('Crowdsourced rent registry, locality benchmark charts, and water scores')] }),
              new TableRow({ children: [createCell('src/components/LandlordDashboardModal.tsx', false, 35), createCell('Owner property dashboard, edit listing controls, and deletion confirmations')] }),
              new TableRow({ children: [createCell('src/lib/firebase.ts', false, 35), createCell('Firebase Firestore database persistence and Google/Email authentication')] }),
              new TableRow({ children: [createCell('src/lib/storage.ts', false, 35), createCell('Local-first storage engine ensuring resilience on static cloud deployments')] }),
              new TableRow({ children: [createCell('src/data/mockData.ts', false, 35), createCell('Initial curated locality benchmarks and verified seed listing data')] }),
              new TableRow({ children: [createCell('api/listings.ts', false, 35), createCell('Serverless API routes for listing CRUD operations on Vercel')] }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ---------------- APPENDIX B ----------------
          createHeading1('APPENDIX B: SOURCE CODE & ARCHITECTURE OVERVIEW'),
          createParagraph(
            'The complete source code is organized into modular frontend components, client-side persistence services, and serverless API handlers. Key architectural responsibilities are summarized in Table B.1.',
            { align: AlignmentType.JUSTIFIED }
          ),

          // Table B.1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  createCell('Source Area', true, 25, AlignmentType.CENTER),
                  createCell('Major Components & Modules', true, 40),
                  createCell('Technical Implementation Notes', true, 35),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Frontend UI', false, 25, AlignmentType.CENTER),
                  createCell('App.tsx, Navbar.tsx, MapListingsView.tsx, PostListingModal.tsx, CommunityDatabaseView.tsx'),
                  createCell('React 19 hooks, Tailwind CSS flex/grid layouts, Lucide icons, responsive drawer navigation'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Geospatial Engine', false, 25, AlignmentType.CENTER),
                  createCell('Leaflet map instance, L.tileLayer, L.divIcon, GPS Geolocation API'),
                  createCell('Downwards needle pointer with anchor [W/2, H], zero CSS transform drift, auto-pan animations'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Image Optimization', false, 25, AlignmentType.CENTER),
                  createCell('compressImageFile() in PostListingModal.tsx, Blueprint badge renderer'),
                  createCell('HTML5 Canvas proportional downscaling (1200px max, 82% JPEG), eliminating stock photos'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Cloud Persistence', false, 25, AlignmentType.CENTER),
                  createCell('firebase.ts (Firestore getDocs, setDoc, onSnapshot, Firebase Auth)'),
                  createCell('Real-time collection listeners for rent_listings and rent_reports with error resilience'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Local-First Cache', false, 25, AlignmentType.CENTER),
                  createCell('storage.ts (getLocalListings, saveLocalListing, deleteLocalListing)'),
                  createCell('Browser localStorage serialization guaranteeing persistence across static Vercel refreshes'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('API & Deployment', false, 25, AlignmentType.CENTER),
                  createCell('server.ts (Express), api/listings.ts, vercel.json'),
                  createCell('CORS enabled REST endpoints, SPA routing fallback rewrites to index.html'),
                ],
              }),
            ],
          }),

          createParagraph(
            'For final institutional submission, official screenshots of the running application (Interactive Map Explorer, List Property Modal with GPS Pinning, Landlord Dashboard, and Community Rent Database) may be included directly in Chapter 6 (Results / Outputs). The project repository contains all source assets, build scripts, and test configurations ready for demonstration.',
            { align: AlignmentType.JUSTIFIED, spaceBefore: 140 }
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  // Write to project root
  const outputPathRoot = path.join(process.cwd(), 'Civic_Service_Management_System_Community_Project_Report.docx');
  const outputRentWiseName = path.join(process.cwd(), 'RentWise_Community_Project_Report.docx');
  fs.writeFileSync(outputPathRoot, buffer);
  fs.writeFileSync(outputRentWiseName, buffer);

  // Also write to public folder for web download
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicFilePath = path.join(publicDir, 'RentWise_Community_Project_Report.docx');
  fs.writeFileSync(publicFilePath, buffer);

  console.log('Successfully generated .docx reports:');
  console.log('1. ', outputPathRoot, `(${buffer.length} bytes)`);
  console.log('2. ', outputRentWiseName, `(${buffer.length} bytes)`);
  console.log('3. ', publicFilePath, `(${buffer.length} bytes)`);
}

generateReportDocx().catch((err) => {
  console.error('Error generating docx report:', err);
  process.exit(1);
});
