import struct, zlib, math

def png(width, height, pixels):
    def chunk(tag, data):
        c = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', c)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    raw = b''.join(b'\x00' + bytes([v for px in row for v in px]) for row in pixels)
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

W, H = 512, 512
ORANGE = (249, 115, 22)
WHITE  = (255, 255, 255)
STROKE = 38  # line thickness (half-width)

def dist_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    seg_len_sq = dx*dx + dy*dy
    if seg_len_sq == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px-ax)*dx + (py-ay)*dy) / seg_len_sq))
    return math.hypot(px - (ax + t*dx), py - (ay + t*dy))

# W anchor points (bold, well-centered in 512x512 circle)
points = [
    (130, 155),   # top-left
    (193, 370),   # bottom-left
    (256, 268),   # center dip
    (319, 370),   # bottom-right
    (382, 155),   # top-right
]

segments = [(points[i], points[i+1]) for i in range(len(points)-1)]

def on_W(x, y):
    return any(dist_to_segment(x, y, ax, ay, bx, by) <= STROKE
               for (ax, ay), (bx, by) in segments)

def in_circle(x, y, r=230):
    return (x - 256)**2 + (y - 256)**2 <= r**2

pixels = []
for y in range(H):
    row = []
    for x in range(W):
        if in_circle(x, y):
            row.append(WHITE if on_W(x, y) else ORANGE)
        else:
            row.append(WHITE)
    pixels.append(row)

with open("public/walter_icon.png", "wb") as f:
    f.write(png(W, H, pixels))

print("Done: public/walter_icon.png")
