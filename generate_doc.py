import zipfile
import os

def create_docx(filename, title, sections):
    # Standard WordprocessingML structure
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    # Generate document.xml body
    body_xml = f"""
    <w:p>
        <w:pPr>
            <w:jc w:val="center"/>
            <w:spacing w:after="300" w:before="200"/>
        </w:pPr>
        <w:r>
            <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:b/>
                <w:color w:val="1E3A8A"/>
                <w:sz w:val="56"/>
            </w:rPr>
            <w:t>{title}</w:t>
        </w:r>
    </w:p>
    <w:p>
        <w:pPr>
            <w:jc w:val="center"/>
            <w:spacing w:after="400"/>
        </w:pPr>
        <w:r>
            <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:i/>
                <w:color w:val="475569"/>
                <w:sz w:val="24"/>
            </w:rPr>
            <w:t>Real-Time Multiplayer Drawing &amp; Guessing System - Comprehensive Technical Architecture</w:t>
        </w:r>
    </w:p>
    """

    for heading, paragraphs in sections:
        body_xml += f"""
        <w:p>
            <w:pPr>
                <w:spacing w:before="360" w:after="160"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:color w:val="2563EB"/>
                    <w:sz w:val="34"/>
                </w:rPr>
                <w:t>{heading}</w:t>
            </w:r>
        </w:p>
        """
        for p in paragraphs:
            is_bullet = p.startswith("• ") or p.startswith("- ")
            clean_text = p[2:] if is_bullet else p
            
            # XML entity escaping
            clean_text = clean_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

            p_pr = ""
            if is_bullet:
                p_pr = """
                <w:pPr>
                    <w:ind w:left="400" w:hanging="200"/>
                    <w:spacing w:after="100"/>
                </w:pPr>
                <w:r>
                    <w:rPr><w:b/><w:color w:val="2563EB"/></w:rPr>
                    <w:t>• </w:t>
                </w:r>
                """
            else:
                p_pr = """
                <w:pPr>
                    <w:spacing w:after="160" w:line="280" w:lineRule="auto"/>
                </w:pPr>
                """

            body_xml += f"""
            <w:p>
                {p_pr}
                <w:r>
                    <w:rPr>
                        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                        <w:color w:val="1E293B"/>
                        <w:sz w:val="22"/>
                    </w:rPr>
                    <w:t>{clean_text}</w:t>
                </w:r>
            </w:p>
            """

    document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        {body_xml}
        <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
        </w:sectPr>
    </w:body>
</w:document>"""

    with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', content_types)
        docx.writestr('_rels/.rels', rels)
        docx.writestr('word/document.xml', document_xml)

    print(f"File created successfully: {filename}")

if __name__ == "__main__":
    sections = [
        ("1. Executive Summary & Overview", [
            "This project is a high-performance, interactive, full-stack multiplayer clone of skribbl.io.",
            "It features real-time canvas synchronization, custom rooms with code/link joining, turn-based round automation, intelligent typo-tolerant word guessing, animated podium leaderboards, and spectator capabilities."
        ]),
        ("2. Complete Technology Stack", [
            "• Frontend: React 18 with TypeScript for type-safe UI component architecture.",
            "• Build Tool: Vite delivering sub-second hot reload and highly optimized production builds.",
            "• Styling & UI: Tailwind CSS utilizing neobrutalist offset shadows and glassmorphic modal designs.",
            "• Vector Canvas: HTML5 Canvas API with hardware acceleration and normalized resolution mapping.",
            "• Backend: Node.js (v20+) with Express for routing, health checks, and production SPA serving.",
            "• Real-Time Engine: Socket.io for low-latency bidirectional WebSocket events and room multiplexing.",
            "• Domain Architecture: Object-Oriented Programming (OOP) via Room, RoomManager, and WordManager classes."
        ]),
        ("3. Drawing Strokes Capture & Rendering Across Clients", [
            "• Resolution-Independent Normalization: Screens differ across phones, laptops, and tablets. Coordinates are captured and converted into normalized ratios between 0.0 and 1.0 (normalizedX = clientX / canvasWidth).",
            "• Transmission: Captured point streams are packed into DrawStroke vector objects and transmitted via socket.emit('draw_stroke').",
            "• Broadcast & Buffering: The server buffers strokes in room.strokes (for history and newly joined players) and immediately streams the stroke to all other participants.",
            "• Local Rendering: Receiving clients denormalize the vector ratios to their local canvas dimensions, rendering identical brush sizes, colors, and strokes across all devices.",
            "• Auto Canvas Reset: Whenever a new round starts or a drawer selects a word, the server triggers canvas_clear and empties strokes, ensuring a clean board for the next drawer."
        ]),
        ("4. Game State & Turn Lifecycle Management", [
            "• Finite State Machine: Phase transitions flow seamlessly through LOBBY -> WORD_SELECTION -> DRAWING -> ROUND_END -> GAME_OVER.",
            "• Turn Order: Managed dynamically via active player arrays. Round counters increment once every active player has completed their drawing turn.",
            "• Server-Driven Timer: An accurate 1-second server interval emits timer_update events, preventing client-side clock tampering or synchronization lag.",
            "• First-Guesser Scoring Rule: The first player to guess the secret word receives time-decayed maximum points (100 to 500 points). Players who guess subsequently receive 0 points to incentivize speed and prevent eavesdropping exploitation."
        ]),
        ("5. Word-Matching & Fuzzy Detection Logic", [
            "• Normalization Engine: Words and guesses are converted to lowercase and stripped of spaces, dashes, and special characters. For example, 'Ice Cream', 'ice-cream', and 'icecream' evaluate as identical.",
            "• Fuzzy Typo Detection: Incorporates a 1-character Levenshtein edit-distance algorithm. If a player submits a guess with a single typo, the server sends a private prompt: 'abc is very close!'.",
            "• Dynamic Non-Repeating Words: Powered by a high-entropy Fisher-Yates shuffle algorithm and per-room history tracking to guarantee unique word selections every round."
        ]),
        ("6. Deployment Architecture & Platform Constraints", [
            "• Vercel / Netlify Constraints: Serverless architectures freeze and terminate executions after 10-60 seconds. They cannot sustain persistent WebSocket connections, in-memory rooms, or Node intervals without third-party services.",
            "• Render Full-Stack Solution: Render provides a persistent Node.js environment supporting long-lived WebSocket connections.",
            "• Unified Deployment: Express directly serves the compiled React SPA from /client/dist while running Socket.io on the identical port, creating a seamless, single-URL deployment without CORS complexities."
        ])
    ]

    create_docx("Skribble_Project_Report.docx", "SKRIBBLE.IO PROJECT REPORT", sections)
