-- ============================================================================
-- QR DNA: Seed Data
-- File: supabase/seed.sql
-- Description: System style templates for QR code customization
-- ============================================================================

insert into style_templates (id, user_id, name, category, style, is_system) values

-- 1. Restaurant
(
  gen_random_uuid(),
  null,
  'Warm Bistro',
  'Restaurant',
  '{
    "dotStyle": "rounded",
    "cornerStyle": "extra-rounded",
    "cornerDotStyle": "dot",
    "fgColor": "#5C1A0B",
    "bgColor": "#FFF8F0",
    "gradient": {
      "type": "linear",
      "rotation": 135,
      "colorStops": [
        { "offset": 0, "color": "#8B2500" },
        { "offset": 1, "color": "#D2691E" }
      ]
    },
    "errorCorrectionLevel": "M",
    "imageMargin": 4
  }',
  true
),

-- 2. Event
(
  gen_random_uuid(),
  null,
  'Festival Pass',
  'Event',
  '{
    "dotStyle": "dots",
    "cornerStyle": "dot",
    "cornerDotStyle": "dot",
    "fgColor": "#6A0DAD",
    "bgColor": "#FFFFFF",
    "gradient": {
      "type": "linear",
      "rotation": 180,
      "colorStops": [
        { "offset": 0, "color": "#6A0DAD" },
        { "offset": 1, "color": "#FF6B6B" }
      ]
    },
    "errorCorrectionLevel": "H",
    "imageMargin": 6
  }',
  true
),

-- 3. Business
(
  gen_random_uuid(),
  null,
  'Corporate Classic',
  'Business',
  '{
    "dotStyle": "square",
    "cornerStyle": "square",
    "cornerDotStyle": "square",
    "fgColor": "#1B2A4A",
    "bgColor": "#FFFFFF",
    "gradient": null,
    "errorCorrectionLevel": "Q",
    "imageMargin": 8
  }',
  true
),

-- 4. Social
(
  gen_random_uuid(),
  null,
  'Social Pop',
  'Social',
  '{
    "dotStyle": "rounded",
    "cornerStyle": "extra-rounded",
    "cornerDotStyle": "dot",
    "fgColor": "#E1306C",
    "bgColor": "#FAFAFA",
    "gradient": {
      "type": "linear",
      "rotation": 45,
      "colorStops": [
        { "offset": 0, "color": "#F58529" },
        { "offset": 0.5, "color": "#DD2A7B" },
        { "offset": 1, "color": "#8134AF" }
      ]
    },
    "errorCorrectionLevel": "M",
    "imageMargin": 4
  }',
  true
),

-- 5. Minimal
(
  gen_random_uuid(),
  null,
  'Clean Slate',
  'Minimal',
  '{
    "dotStyle": "square",
    "cornerStyle": "square",
    "cornerDotStyle": "square",
    "fgColor": "#222222",
    "bgColor": "#FFFFFF",
    "gradient": null,
    "errorCorrectionLevel": "L",
    "imageMargin": 2
  }',
  true
),

-- 6. Bold
(
  gen_random_uuid(),
  null,
  'High Impact',
  'Bold',
  '{
    "dotStyle": "classy-rounded",
    "cornerStyle": "extra-rounded",
    "cornerDotStyle": "square",
    "fgColor": "#FF0000",
    "bgColor": "#0A0A0A",
    "gradient": {
      "type": "linear",
      "rotation": 0,
      "colorStops": [
        { "offset": 0, "color": "#FF0000" },
        { "offset": 1, "color": "#FF6600" }
      ]
    },
    "errorCorrectionLevel": "H",
    "imageMargin": 6
  }',
  true
),

-- 7. Neon
(
  gen_random_uuid(),
  null,
  'Cyber Glow',
  'Neon',
  '{
    "dotStyle": "dots",
    "cornerStyle": "dot",
    "cornerDotStyle": "dot",
    "fgColor": "#00FFAA",
    "bgColor": "#0D0D0D",
    "gradient": {
      "type": "linear",
      "rotation": 90,
      "colorStops": [
        { "offset": 0, "color": "#00FFAA" },
        { "offset": 0.5, "color": "#00CCFF" },
        { "offset": 1, "color": "#AA00FF" }
      ]
    },
    "errorCorrectionLevel": "M",
    "imageMargin": 4
  }',
  true
),

-- 8. Elegant
(
  gen_random_uuid(),
  null,
  'Gold Luxe',
  'Elegant',
  '{
    "dotStyle": "classy",
    "cornerStyle": "extra-rounded",
    "cornerDotStyle": "dot",
    "fgColor": "#8B7532",
    "bgColor": "#FFFEF5",
    "gradient": {
      "type": "linear",
      "rotation": 135,
      "colorStops": [
        { "offset": 0, "color": "#BFA14A" },
        { "offset": 0.5, "color": "#8B7532" },
        { "offset": 1, "color": "#D4AF37" }
      ]
    },
    "errorCorrectionLevel": "Q",
    "imageMargin": 6
  }',
  true
),

-- 9. Tech
(
  gen_random_uuid(),
  null,
  'Circuit Board',
  'Tech',
  '{
    "dotStyle": "square",
    "cornerStyle": "square",
    "cornerDotStyle": "square",
    "fgColor": "#00B4D8",
    "bgColor": "#0B1622",
    "gradient": {
      "type": "linear",
      "rotation": 180,
      "colorStops": [
        { "offset": 0, "color": "#00B4D8" },
        { "offset": 1, "color": "#0077B6" }
      ]
    },
    "errorCorrectionLevel": "M",
    "imageMargin": 4
  }',
  true
),

-- 10. Nature
(
  gen_random_uuid(),
  null,
  'Forest Canopy',
  'Nature',
  '{
    "dotStyle": "rounded",
    "cornerStyle": "extra-rounded",
    "cornerDotStyle": "dot",
    "fgColor": "#2D6A4F",
    "bgColor": "#F5FFF5",
    "gradient": {
      "type": "linear",
      "rotation": 160,
      "colorStops": [
        { "offset": 0, "color": "#40916C" },
        { "offset": 0.5, "color": "#2D6A4F" },
        { "offset": 1, "color": "#1B4332" }
      ]
    },
    "errorCorrectionLevel": "M",
    "imageMargin": 4
  }',
  true
);
