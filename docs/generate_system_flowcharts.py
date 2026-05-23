from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "system-flowcharts.png"

PRIMARY = "#608DB9"
PRIMARY_DARK = "#183B5B"
PRIMARY_DEEP = "#0F2742"
PRIMARY_SOFT = "#EAF3FB"
PRIMARY_PALE = "#F7FBFF"
TEXT = "#172033"
MUTED = "#607089"
BORDER = "#BFD3E8"
WHITE = "#FFFFFF"

BOARD_W = 4800
BOARD_H = 4720
MARGIN = 90
GAP = 48
HEADER_H = 250
PANEL_W = (BOARD_W - (MARGIN * 2) - (GAP * 2)) // 3
PANEL_H = (BOARD_H - HEADER_H - MARGIN - (GAP * 3)) // 4


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


FONT_TITLE = font(70, True)
FONT_SUBTITLE = font(34)
FONT_PANEL = font(31, True)
FONT_NODE = font(21)
FONT_NODE_BOLD = font(21, True)
FONT_SMALL = font(18)
FONT_TAG = font(16, True)


@dataclass
class Node:
    kind: str
    text: str


@dataclass
class Branch:
    from_index: int
    label: str
    text: str
    side: str = "right"
    return_to: int | None = None
    offset: int = 0


@dataclass
class Flow:
    title: str
    role: str
    nodes: list[Node]
    branches: list[Branch] = field(default_factory=list)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def wrapped_lines(text: str, chars: int) -> list[str]:
    lines: list[str] = []
    for part in text.split("\n"):
        lines.extend(wrap(part, width=chars) or [""])
    return lines


def draw_center_text(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: str = TEXT,
    chars: int = 26,
    line_gap: int = 5,
) -> None:
    x1, y1, x2, y2 = box
    lines = wrapped_lines(text, chars)
    heights = [text_size(draw, line, fnt)[1] for line in lines]
    total_h = sum(heights) + line_gap * (len(lines) - 1)
    y = y1 + ((y2 - y1) - total_h) / 2
    for line, h in zip(lines, heights):
        w, _ = text_size(draw, line, fnt)
        draw.text((x1 + ((x2 - x1) - w) / 2, y), line, font=fnt, fill=fill)
        y += h + line_gap


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str = PRIMARY, width: int = 4) -> None:
    draw.line([start, end], fill=color, width=width)
    sx, sy = start
    ex, ey = end
    dx = ex - sx
    dy = ey - sy
    if abs(dx) > abs(dy):
        if dx >= 0:
            head = [(ex, ey), (ex - 16, ey - 9), (ex - 16, ey + 9)]
        else:
            head = [(ex, ey), (ex + 16, ey - 9), (ex + 16, ey + 9)]
    else:
        if dy >= 0:
            head = [(ex, ey), (ex - 9, ey - 16), (ex + 9, ey - 16)]
        else:
            head = [(ex, ey), (ex - 9, ey + 16), (ex + 9, ey + 16)]
    draw.polygon(head, fill=color)


def draw_node(
    draw: ImageDraw.ImageDraw,
    center: tuple[int, int],
    node: Node,
    width: int,
    height: int,
) -> tuple[int, int, int, int]:
    cx, cy = center
    x1 = cx - width // 2
    y1 = cy - height // 2
    x2 = cx + width // 2
    y2 = cy + height // 2

    if node.kind == "start" or node.kind == "end":
        draw.rounded_rectangle((x1, y1, x2, y2), radius=height // 2, fill=PRIMARY_DARK, outline=PRIMARY_DARK, width=3)
        draw_center_text(draw, (x1 + 18, y1 + 8, x2 - 18, y2 - 8), node.text, FONT_NODE_BOLD, fill=WHITE, chars=28)
    elif node.kind == "decision":
        points = [(cx, y1), (x2, cy), (cx, y2), (x1, cy)]
        draw.polygon(points, fill=PRIMARY_SOFT, outline=PRIMARY, width=4)
        draw_center_text(draw, (x1 + 36, y1 + 12, x2 - 36, y2 - 12), node.text, FONT_NODE_BOLD, fill=PRIMARY_DEEP, chars=18)
    else:
        draw.rectangle((x1, y1, x2, y2), fill=WHITE, outline=PRIMARY, width=3)
        draw_center_text(draw, (x1 + 18, y1 + 8, x2 - 18, y2 - 8), node.text, FONT_NODE, fill=TEXT, chars=28)

    return x1, y1, x2, y2


def draw_branch(
    draw: ImageDraw.ImageDraw,
    panel: tuple[int, int, int, int],
    node_boxes: list[tuple[int, int, int, int]],
    branch: Branch,
) -> None:
    x, y, w, _h = panel
    source = node_boxes[branch.from_index]
    source_y = (source[1] + source[3]) // 2
    main_center_x = (source[0] + source[2]) // 2
    side_right = branch.side == "right"
    branch_w = 315
    branch_h = 74
    target_cx = x + w - 205 if side_right else x + 205
    target_cy = source_y + branch.offset
    bx1 = target_cx - branch_w // 2
    by1 = target_cy - branch_h // 2
    bx2 = target_cx + branch_w // 2
    by2 = target_cy + branch_h // 2

    start = (source[2], source_y) if side_right else (source[0], source_y)
    mid_x = bx1 if side_right else bx2
    end = (mid_x, target_cy)
    arrow(draw, start, end, color=PRIMARY_DARK, width=3)

    label_x = (start[0] + end[0]) // 2
    label_y = source_y - 28 if branch.offset <= 0 else source_y + 8
    draw.rounded_rectangle((label_x - 26, label_y - 16, label_x + 26, label_y + 16), radius=16, fill=PRIMARY_SOFT, outline=BORDER, width=2)
    draw_center_text(draw, (label_x - 24, label_y - 13, label_x + 24, label_y + 13), branch.label, FONT_TAG, fill=PRIMARY_DARK, chars=8)

    draw.rectangle((bx1, by1, bx2, by2), fill=PRIMARY_PALE, outline=BORDER, width=3)
    draw_center_text(draw, (bx1 + 12, by1 + 8, bx2 - 12, by2 - 8), branch.text, FONT_SMALL, fill=TEXT, chars=24)

    if branch.return_to is not None:
        dest = node_boxes[branch.return_to]
        dest_y = (dest[1] + dest[3]) // 2
        branch_exit = (bx1, target_cy) if side_right else (bx2, target_cy)
        return_x = dest[2] + 26 if side_right else dest[0] - 26
        draw.line([branch_exit, (return_x, target_cy), (return_x, dest_y)], fill=BORDER, width=3)
        arrow(draw, (return_x, dest_y), (dest[2], dest_y) if side_right else (dest[0], dest_y), color=BORDER, width=3)


def draw_panel(draw: ImageDraw.ImageDraw, flow: Flow, x: int, y: int) -> None:
    draw.rounded_rectangle((x, y, x + PANEL_W, y + PANEL_H), radius=30, fill=WHITE, outline=BORDER, width=3)
    draw.rounded_rectangle((x, y, x + PANEL_W, y + 110), radius=30, fill=PRIMARY_SOFT, outline=BORDER, width=0)
    draw.rectangle((x, y + 75, x + PANEL_W, y + 110), fill=PRIMARY_SOFT)

    draw.text((x + 40, y + 25), flow.title, font=FONT_PANEL, fill=PRIMARY_DEEP)
    tag = flow.role.upper()
    tag_w, tag_h = text_size(draw, tag, FONT_TAG)
    draw.rounded_rectangle((x + PANEL_W - tag_w - 76, y + 28, x + PANEL_W - 38, y + 28 + tag_h + 20), radius=18, fill=WHITE, outline=BORDER, width=2)
    draw.text((x + PANEL_W - tag_w - 58, y + 38), tag, font=FONT_TAG, fill=PRIMARY)

    count = len(flow.nodes)
    top = y + 170
    bottom = y + PANEL_H - 70
    step = (bottom - top) / max(count - 1, 1)
    main_x = x + PANEL_W // 2
    node_boxes: list[tuple[int, int, int, int]] = []

    for i, node in enumerate(flow.nodes):
        cy = int(top + (i * step))
        if node.kind == "decision":
            box = draw_node(draw, (main_x, cy), node, 390, 108)
        elif node.kind in {"start", "end"}:
            box = draw_node(draw, (main_x, cy), node, 440, 68)
        else:
            box = draw_node(draw, (main_x, cy), node, 500, 72)
        node_boxes.append(box)

    for i in range(len(node_boxes) - 1):
        current = node_boxes[i]
        nxt = node_boxes[i + 1]
        arrow(draw, ((current[0] + current[2]) // 2, current[3]), ((nxt[0] + nxt[2]) // 2, nxt[1]), color=PRIMARY, width=4)

    for branch in flow.branches:
        draw_branch(draw, (x, y, PANEL_W, PANEL_H), node_boxes, branch)


FLOWS = [
    Flow(
        "1. Client Booking Request",
        "Client",
        [
            Node("start", "Start: client visits website"),
            Node("process", "Browse products or use AR measurement"),
            Node("decision", "Quote items selected?"),
            Node("process", "Fill contact, date, time, and address"),
            Node("decision", "Details valid?"),
            Node("process", "Create appointment and link customer account"),
            Node("process", "Send confirmation, reference number, and OTP link"),
            Node("end", "End: pending appointment"),
        ],
        [
            Branch(2, "Yes", "Attach quote items", "right", 3, -10),
            Branch(2, "No", "Book inspection only", "left", 3, 10),
            Branch(4, "No", "Show field errors", "left", 3, 0),
        ],
    ),
    Flow(
        "2. Customer OTP Login",
        "Client",
        [
            Node("start", "Start: customer opens login"),
            Node("process", "Enter phone number or email"),
            Node("decision", "Linked record exists?"),
            Node("process", "Send one-time password"),
            Node("decision", "OTP valid and not expired?"),
            Node("process", "Create 14-day customer session"),
            Node("process", "Show appointments, work jobs, quotes, and payments"),
            Node("end", "End: customer dashboard"),
        ],
        [
            Branch(2, "No", "Guide user to book or contact support", "left", None, 0),
            Branch(4, "No", "Retry, expire, or rate limit", "right", 3, 0),
        ],
    ),
    Flow(
        "3. Admin Scheduling",
        "Admin",
        [
            Node("start", "Start: new pending appointment"),
            Node("process", "Review customer details, address, map, and quote"),
            Node("decision", "Cancel request?"),
            Node("process", "Open calendar and available worker list"),
            Node("decision", "Slot and workers available?"),
            Node("process", "Confirm date, time, and assigned staff"),
            Node("process", "Record remark, audit, and notification"),
            Node("end", "End: confirmed appointment"),
        ],
        [
            Branch(2, "Yes", "Cancel with reason and notify client", "left", None, 0),
            Branch(4, "No", "Choose another slot", "right", 3, 0),
        ],
    ),
    Flow(
        "4. Quotation and Signature",
        "Client / Admin",
        [
            Node("start", "Start: quote draft or inspection result"),
            Node("process", "Admin or staff edits line items, options, and prices"),
            Node("process", "Send quote ready notification"),
            Node("decision", "Customer approves?"),
            Node("process", "Customer signs e-quotation"),
            Node("decision", "Quote changed later?"),
            Node("process", "Generate signed PDF and store signature record"),
            Node("end", "End: approved quotation"),
        ],
        [
            Branch(3, "No", "Request changes or reject item", "left", 1, 0),
            Branch(5, "Yes", "Invalidate signature and require re-sign", "right", 3, 0),
        ],
    ),
    Flow(
        "5. Staff Inspection",
        "Staff",
        [
            Node("start", "Start: assigned appointment"),
            Node("process", "Staff sees assigned work only"),
            Node("process", "Mark on the way and notify customer"),
            Node("process", "Arrive and mark in progress"),
            Node("process", "Upload before photos and measurements"),
            Node("decision", "Quote needed or changed?"),
            Node("process", "Complete inspection and add remarks"),
            Node("end", "End: inspected or completed"),
        ],
        [
            Branch(5, "Yes", "Create or update quotation", "right", 6, 0),
            Branch(5, "No", "Proceed without quote edit", "left", 6, 0),
        ],
    ),
    Flow(
        "6. Work Job Execution",
        "Admin / Staff",
        [
            Node("start", "Start: approved quote or direct job"),
            Node("process", "Admin creates work job from appointment"),
            Node("process", "Set schedule and assign workers"),
            Node("process", "Notify customer and staff"),
            Node("process", "Staff starts job and uploads after photos"),
            Node("decision", "Completed today?"),
            Node("process", "Mark completed and send job update"),
            Node("end", "End: work job complete"),
        ],
        [
            Branch(5, "No", "Create continuation or back job", "left", None, 0),
            Branch(5, "Yes", "Proceed to completion", "right", 6, 0),
        ],
    ),
    Flow(
        "7. Payment Lifecycle",
        "Client / Admin",
        [
            Node("start", "Start: payable work job balance"),
            Node("decision", "Down payment required?"),
            Node("process", "Open PayPal checkout or record offline payment"),
            Node("decision", "Payment successful?"),
            Node("process", "Record paid payment and cancel stale pending checkouts"),
            Node("decision", "Additional approved charges?"),
            Node("process", "Collect final balance or extra charge"),
            Node("end", "End: fully paid or remaining due shown"),
        ],
        [
            Branch(1, "Yes", "Allow down payment or full payment", "left", 2, 0),
            Branch(1, "No", "Allow full payment", "right", 2, 0),
            Branch(3, "No", "Keep retry path and cancel stale attempts", "left", 2, 0),
            Branch(5, "Yes", "Use additional charge payment type", "right", 6, 0),
        ],
    ),
    Flow(
        "8. Cancel, No-Show, Reopen",
        "All Roles",
        [
            Node("start", "Start: active appointment or work job"),
            Node("decision", "Customer cancels?"),
            Node("process", "Scheduled day arrives"),
            Node("decision", "Customer present?"),
            Node("process", "Continue service workflow"),
            Node("decision", "Reopen required?"),
            Node("process", "Add remark, audit, and notification"),
            Node("end", "End: closed, reopened, or active"),
        ],
        [
            Branch(1, "Yes", "Cancel, hide edit/pay, offer rebook", "left", None, 0),
            Branch(3, "No", "Mark no-show and notify customer", "right", 5, 0),
            Branch(5, "No", "Keep final status", "left", 7, 0),
        ],
    ),
    Flow(
        "9. Back Job and Warranty",
        "Client / Admin / Staff",
        [
            Node("start", "Start: completed work job"),
            Node("process", "Customer reports issue or staff marks unfinished work"),
            Node("decision", "Warranty or valid back job?"),
            Node("process", "Create linked back job without re-billing original quote"),
            Node("process", "Schedule staff and notify customer"),
            Node("process", "Execute fix and upload photos"),
            Node("decision", "Extra approved charges?"),
            Node("end", "End: issue resolved"),
        ],
        [
            Branch(2, "No", "Decline or create paid extra service", "left", None, 0),
            Branch(6, "Yes", "Collect additional charge only", "right", 7, 0),
            Branch(6, "No", "No payment required", "left", 7, 0),
        ],
    ),
    Flow(
        "10. Product, 3D Model, AR Quote",
        "Admin / Client",
        [
            Node("start", "Start: admin manages product catalog"),
            Node("process", "Add product details, images, variants, and options"),
            Node("process", "Upload product 3D model for AR preview"),
            Node("decision", "Product active?"),
            Node("process", "Client browses products or measures with AR"),
            Node("process", "Selected items become quote cart entries"),
            Node("process", "Pass items to booking request summary"),
            Node("end", "End: quote-ready product selection"),
        ],
        [
            Branch(3, "No", "Hide from customer pages", "left", None, 0),
            Branch(3, "Yes", "Publish to product and AR catalog", "right", 4, 0),
        ],
    ),
    Flow(
        "11. Notifications and Audit",
        "System",
        [
            Node("start", "Start: important event occurs"),
            Node("process", "Determine recipients by role and ownership"),
            Node("process", "Store database notification"),
            Node("process", "Broadcast real-time update through Reverb/Echo"),
            Node("decision", "Delivered live?"),
            Node("process", "UI updates status, badges, and lists"),
            Node("process", "Write audit log with before and after values"),
            Node("end", "End: traceable event history"),
        ],
        [
            Branch(4, "No", "Show unread notification on next load", "left", 5, 0),
            Branch(4, "Yes", "Refresh affected record instantly", "right", 5, 0),
        ],
    ),
    Flow(
        "12. Reports and Payment Admin",
        "Admin",
        [
            Node("start", "Start: admin opens payments or sales reports"),
            Node("process", "Filter by date, status, method, customer, or work job"),
            Node("process", "Reconcile PayPal and offline payments"),
            Node("decision", "Mismatch, refund, or failed payment?"),
            Node("process", "Generate totals, charts, and sales summaries"),
            Node("process", "Export PDF, Excel, or CSV"),
            Node("process", "Review audit details if needed"),
            Node("end", "End: business report ready"),
        ],
        [
            Branch(3, "Yes", "Investigate and update payment status", "right", 4, 0),
            Branch(3, "No", "Proceed to reporting", "left", 4, 0),
        ],
    ),
]


def main() -> None:
    image = Image.new("RGB", (BOARD_W, BOARD_H), PRIMARY_PALE)
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle((MARGIN, 55, BOARD_W - MARGIN, HEADER_H - 30), radius=36, fill=WHITE, outline=BORDER, width=3)
    draw.text((MARGIN + 55, 92), "SOG Glass & Aluminum Appointment Booking System", font=FONT_TITLE, fill=PRIMARY_DEEP)
    draw.text(
        (MARGIN + 58, 175),
        "Complete role-based process flowcharts for client, admin, staff, payments, notifications, reports, and back jobs.",
        font=FONT_SUBTITLE,
        fill=MUTED,
    )

    for index, flow in enumerate(FLOWS):
        row = index // 3
        col = index % 3
        x = MARGIN + col * (PANEL_W + GAP)
        y = HEADER_H + row * (PANEL_H + GAP)
        draw_panel(draw, flow, x, y)

    image.save(OUT, "PNG", optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
