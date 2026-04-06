# Teacher Web — UI/UX Design System

> Tài liệu thiết kế hệ thống UI/UX cho **teacher-web**. Mục tiêu: đảm bảo sự nhất quán về giao diện, tương tác và trải nghiệm người dùng trên toàn bộ ứng dụng giáo viên.

---

## 1. Tổng Quan & Nguyên Tắc Thiết Kế

### 1.1 Identity & Positioning
- **Đối tượng**: Giáo viên / Quản trị viên lớp học
- **Tone of Voice**: Chuyên nghiệp, đáng tin cậy, thân thiện nhưng không phải trẻ con
- **Cách tính**: Phẳng (Flat) kết hợp Material với shadow nhẹ, bo góc tròn
- **Độ phức tạp**: Trung bình — đủ thông tin để quản lý nhưng không gây overload

### 1.2 Nguyên Tắc Cốt Lõi

1. **Clarity First** — Mọi thông tin quan trọng phải nổi bật (primary color, kích thước, vị trí)
2. **Consistent Patterns** — Dùng lại component đã có thay vì tạo mới; nếu tạo mới phải tuân theo design token
3. **Progressive Disclosure** — Hiển thị thông tin theo mức độ ưu tiên: chính → phụ → chi tiết
4. **Accessible by Default** — Tất cả interactive elements có `focus-visible` ring, đủ contrast, kích thước ≥ 44px
5. **Mobile-First Responsive** — Thiết kế từ mobile trước, mở rộng lên desktop

### 1.3 Color Contrast Compliance
- Văn bản trên nền sáng: contrast ratio ≥ 4.5:1 (WCAG AA)
- Văn bản lớn (≥18px bold / ≥24px regular): ≥ 3:1 (WCAG AA)
- Tất cả màu status phải có thêm icon hoặc text label, không chỉ dùng màu để truyền tải ý nghĩa

---

## 2. Design Tokens

### 2.1 Color Palette

#### Primary Colors (Teal — Brand)
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#2E7D6B` | Nút chính, trạng thái active, link, icon chính |
| `primary-hover` | `#286B5C` | Hover state cho primary elements |
| `primary-light` | `#E6F4F1` | Background tints, badge nền, selected items |
| `primary-dark` | `#1F5C4A` | Pressed state, text trên nền sáng |
| `secondary` | `#6BAFA1` | Accent thứ hai, gradient phụ |

#### Neutral Colors (Slate)
| Token | Hex | Usage |
|---|---|---|
| `background` | `#F7FAF9` | Page background chính |
| `background-light` | `#EEF6F3` | Alternating sections, subtle surface |
| `surface` | `#FFFFFF` | Cards, panels, modals |
| `border` | `#E2ECE9` | Card border, input border, divider |
| `border-light` | `#F0F5F3` | Dividers nhẹ |
| `overlay` | `rgba(31,45,43,0.4)` | Modal backdrop |
| `overlay-light` | `rgba(31,45,43,0.2)` | Tooltip, popover backdrop |

#### Text Colors
| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#1F2D2B` | Heading, body chính |
| `text-secondary` | `#5F7C76` | Label, description, supporting text |
| `text-muted` | `#8FA7A2` | Placeholder, timestamp, disabled |
| `text-tertiary` | `#B5C4BF` | Out-of-range dates, decorative |
| `text-inverse` | `#FFFFFF` | Text trên nền tối/primary |

#### Status Colors
| Token | BG | Text | Usage |
|---|---|---|---|
| `success` | `#D4EDDA` | `#155724` | Hoàn thành, đạt điểm cao, active |
| `success-light` | `#E8F5E9` | `#4CAF8F` | Variant nhẹ hơn |
| `warning` | `#FFF3CD` | `#856404` | Pending, chưa chấm, sắp hết hạn |
| `warning-light` | `#FFF8E1` | `#F4B266` | Variant nhẹ hơn |
| `error` | `#F8D7DA` | `#721C24` | Lỗi, xóa, vắng mặt |
| `error-light` | `#FFEBEE` | `#E57373` | Variant nhẹ hơn |
| `info` | `#E6F4F1` | `#2E7D6B` | Thông tin, badge phụ |

### 2.2 Typography

#### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

#### Type Scale
| Class | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `text-xs` | 12px | 400 | 1.5 | Badge, timestamp, caption |
| `text-sm` | 14px | 400–500 | 1.5 | Body nhỏ, label, description |
| `text-base` | 16px | 400 | 1.5 | Body text chính |
| `text-lg` | 18px | 500 | 1.4 | Sub-heading, card title |
| `text-xl` | 20px | 600 | 1.3 | Page section title |
| `text-2xl` | 24px | 700 | 1.2 | Page title |
| `text-3xl` | 30px | 700 | 1.1 | Dashboard hero stat |
| `text-4xl` | 36px | 700 | 1.0 | Login page heading |

#### Letter Spacing
- Headings (`text-2xl`+): `-0.025em` (`.tracking-tight`)
- Large headings (`text-4xl`): `-0.03em` (`.tracking-tighter`)

### 2.3 Spacing System

Sử dụng **4px base unit** (Tailwind scale):

| Token | Value | Common Use |
|---|---|---|
| `space-1` | 4px | Icon padding, tight gaps |
| `space-2` | 8px | Internal component spacing |
| `space-3` | 12px | Input padding-y, badge padding |
| `space-4` | 16px | Card padding, gap between cards |
| `space-5` | 20px | Section padding |
| `space-6` | 24px | Page section gap |
| `space-8` | 32px | Major section divider |
| `space-10` | 40px | Page header spacing |
| `space-12` | 48px | Hero section gap |

### 2.4 Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-lg` | 8px | Input, button nhỏ |
| `rounded-xl` | 12px | Small card, dropdown |
| `rounded-2xl` | 16px | Main card, modal content |
| `rounded-3xl` | 24px | Large card, hero section |
| `rounded-full` | 9999px | Pill, avatar, badge, nav item |

### 2.5 Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | Input, subtle lift |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Card default |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.10)` | Card hover, dropdown |
| `shadow-xl` | `0 12px 32px rgba(0,0,0,0.12)` | Modal, toast |
| `shadow-card` | `0 4px 16px -6px rgba(0,0,0,0.08)` | `.card` class (custom) |

### 2.6 Motion & Animation

#### Timing Functions
```css
--transition-elegant: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-fast:   0.15s ease;
--transition-slow:   0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

#### Animation Keyframes
| Name | Effect | Duration | Usage |
|---|---|---|---|
| `fadeIn` | opacity 0→1 | 0.4s | Modal, dropdown entrance |
| `fadeInUp` | opacity 0→1, translateY 16px→0 | 0.5s | Page content, cards |
| `slideInLeft` | opacity 0→1, translateX -16px→0 | 0.4s | Sidebar, notification |
| `slideInRight` | opacity 0→1, translateX 16px→0 | 0.4s | Sidebar panels |
| `scaleIn` | opacity 0→1, scale 0.95→1 | 0.3s | Modal content |
| `skeleton-loading` | background-position shimmer | 1.5s loop | Skeleton loading |
| `spin` | rotate 0→360deg | 1s linear | Spinner |
| `pulse` | opacity 1→0.5→1 | 2s ease-in-out | Live indicators |
| `bounce` | translateY with keyframe | 0.6s | Success feedback |

#### Interaction Patterns
- **Card hover**: `transform: translateY(-4px)` + enhanced shadow, 0.3s
- **Button hover**: `translateY(-1px)` + enhanced shadow, 0.2s
- **Button press**: `translateY(1px)`, 0.1s
- **Focus ring**: `box-shadow: 0 0 0 3px rgba(46,125,107,0.15)` (primary) hoặc `0 0 0 3px rgba(255,255,255,0.5)` (dark bg)
- **Page transitions**: Staggered fade-in cho list items (50ms delay giữa các items)

### 2.7 Breakpoints

| Name | Min-width | Usage |
|---|---|---|
| `sm` | 640px | Large phone, small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

### 2.8 Z-Index Scale

| Layer | Value | Usage |
|---|---|---|
| Base | 0 | Default stacking |
| Dropdown | 50 | `.dropdown` class |
| Sticky | 100 | `sticky` elements |
| Fixed | 200 | Layout header |
| Modal Backdrop | 300 | `.modal-overlay` |
| Modal | 400 | `.modal-content` |
| Toast | 500 | Notification toast |
| Tooltip | 600 | Tooltip overlay |

---

## 3. Component System

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (sticky, h-16, backdrop-blur-md)                │
│  [Logo] [Nav Pills]              [Notif] [Avatar▾]     │
├─────────────────────────────────────────────────────────┤
│  MAIN CONTENT (py-6 px-4 md:px-6 max-w-7xl mx-auto)     │
│                                                         │
│  Page Header (title + breadcrumb + actions)            │
│  ─────────────────────────────────────────────────────  │
│  Content Grid / Table / Form                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Header
- **Height**: 64px (`h-16`)
- **Background**: `bg-white/90 backdrop-blur-md border-b border-border`
- **Sticky**: `sticky top-0 z-[100]`
- **Left**: Logo (40px height, hover scale 1.05)
- **Center**: Nav pills (`rounded-full bg-gradient-to-r from-surface to-surface-hover border border-border shadow-soft px-1`)
- **Right**: Notification bell (24px, hover bg-primary/10) + Avatar dropdown

#### Navigation Pills (Desktop)
- Container: `rounded-full px-1 py-1 flex items-center gap-1 bg-gradient-to-r from-white to-surface border border-border shadow-soft`
- Item inactive: `px-4 py-2 rounded-full text-sm font-medium text-text-secondary transition-all hover:text-primary hover:bg-primary/5`
- Item active: `px-4 py-2 rounded-full text-sm font-semibold text-primary bg-white shadow-sm`
- Item icon: `w-4 h-4`

#### Mobile Navigation
- Hamburger button: top-right, `w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface`
- Menu: `absolute top-16 right-0 w-64 bg-white/95 backdrop-blur-md border border-border shadow-lg rounded-b-2xl z-50`
- Menu item: `flex items-center gap-3 px-4 py-3 hover:bg-surface text-text-secondary hover:text-primary`
- Menu item active: `bg-primary/10 text-primary font-medium`

### 3.2 Page Header Pattern

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <div>
    <h1 className="text-2xl font-bold text-text-primary tracking-tight">
      {pageTitle}
    </h1>
    {breadcrumb && (
      <p className="text-sm text-text-muted mt-1">{breadcrumb}</p>
    )}
  </div>
  <div className="flex items-center gap-3">
    {/* Action buttons */} 
  </div>
</div>
```

### 3.3 Cards

#### `.card` — Standard Card
```css
.card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 4px 16px -6px rgba(0,0,0,0.08);
  border: 1px solid #E2ECE9;
}
```
```tsx
<div className="card p-4 md:p-6">
  {/* Card content */}
</div>
```

**Mobile behavior** (`< 639px`):
```css
@media (max-width: 638px) {
  .card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
  }
}
```

#### `.card-hover` — Interactive Card
```tsx
<motion.div
  whileHover={{ y: -4, boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12)' }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  className="card p-4 cursor-pointer"
>
```

#### `.stat-card` — Statistic Card (Dashboard)
```tsx
<div className="card p-5 flex items-center gap-4">
  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-light">
    {icon}
  </div>
  <div>
    <p className="text-sm text-text-secondary font-medium">{label}</p>
    <p className="text-2xl font-bold text-text-primary">{value}</p>
  </div>
</div>
```

#### `.class-card` — Class Listing Card
```tsx
<div className="card p-4">
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1">
      <h3 className="font-semibold text-text-primary">{className}</h3>
      <p className="text-xs text-text-muted">{classCode}</p>
    </div>
    <Badge variant="info">{studentCount} học sinh</Badge>
  </div>
  <div className="flex gap-3 pt-3 border-t border-border">
    <Button variant="outline" size="sm" className="flex-1">Học sinh</Button>
    <Button variant="outline" size="sm" className="flex-1">Bài tập</Button>
    <Button variant="outline" size="sm" className="flex-1">Kiểm tra</Button>
  </div>
</div>
```

### 3.4 Buttons

#### Primary Button (`.btn-primary`)
```css
.btn-primary {
  background: linear-gradient(135deg, #2E7D6B 0%, #286B5C 100%);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(46, 125, 107, 0.25);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(46, 125, 107, 0.35);
  filter: brightness(1.05);
}
.btn-primary:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(46, 125, 107, 0.2);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

#### Secondary Button (`.btn-secondary`)
```css
.btn-secondary {
  background: #FFFFFF;
  color: #5F7C76;
  border: 1px solid #E2ECE9;
  border-radius: 12px;
  font-weight: 500;
  padding: 10px 20px;
  transition: all 0.2s ease;
}
.btn-secondary:hover {
  background: #F7FAF9;
  border-color: #6BAFA1;
  color: #2E7D6B;
}
```

#### Outline Button (`.btn-outline`)
```css
.btn-outline {
  background: transparent;
  color: #2E7D6B;
  border: 2px solid #2E7D6B;
  border-radius: 12px;
  font-weight: 600;
  padding: 8px 20px;
  transition: all 0.2s ease;
}
.btn-outline:hover {
  background: #2E7D6B;
  color: white;
}
```

#### Danger Button
```css
.btn-danger {
  background: #FEE2E2;
  color: #DC2626;
  border-radius: 12px;
  font-weight: 600;
  padding: 10px 20px;
  transition: all 0.2s ease;
}
.btn-danger:hover {
  background: #DC2626;
  color: white;
}
```

#### Button Sizes
| Size | Class | Padding | Font | Usage |
|---|---|---|---|---|
| sm | `.btn-sm` | 6px 12px | 12px | Table actions, inline |
| md | `.btn-md` (default) | 10px 20px | 14px | Standard actions |
| lg | `.btn-lg` | 12px 24px | 16px | Hero CTA |
| icon | `.btn-icon` | 8px | — | Single icon buttons |

#### Icon Button
```tsx
<button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface hover:text-primary transition-colors">
  {icon}
</button>
```

### 3.5 Form Inputs

#### Text Input (`.input-field`)
```css
.input-field {
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #E2ECE9;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
  color: #1F2D2B;
  transition: all 0.2s ease;
  outline: none;
}
.input-field::placeholder {
  color: #8FA7A2;
}
.input-field:focus {
  border-color: #2E7D6B;
  box-shadow: 0 0 0 3px rgba(46, 125, 107, 0.1);
}
.input-field:disabled {
  background: #F7FAF9;
  color: #8FA7A2;
  cursor: not-allowed;
}
```

#### Input with Icon
```tsx
<div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
    <Search className="w-4 h-4 text-text-muted" />
  </div>
  <input className="input-field pl-10" placeholder="Search..." />
</div>
```

#### Select
```tsx
<select className="input-field appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg...')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10">
  {/* Options */}
</select>
```

#### Textarea
```css
textarea.input-field {
  min-height: 100px;
  resize: vertical;
}
```

#### Form Layout
```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-text-primary mb-1.5">
      Label <span className="text-error">*</span>
    </label>
    <input className="input-field" />
    <p className="text-xs text-text-muted mt-1">Helper text</p>
  </div>
</form>
```

### 3.6 Badges / Status Indicators

```tsx
// Badge base styles
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
  {icon && <span className="w-3 h-3">{icon}</span>}
  {label}
</div>
```

| Variant | Classes | Color | Usage |
|---|---|---|---|
| success | `bg-success/20 text-success` | Green | Hoàn thành, active, đạt |
| warning | `bg-warning/20 text-warning` | Amber | Pending, chưa chấm, sắp hết hạn |
| error | `bg-error/20 text-error` | Red | Lỗi, vắng mặt, chưa nộp |
| info | `bg-primary-light text-primary` | Teal | Thông tin, mặc định |
| default | `bg-surface text-text-secondary border border-border` | Gray | Trạng thái khác |
| live | Pulsing dot + green text | Green | Ca thi đang diễn ra |

### 3.7 Tables

```tsx
<div className="card overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-surface">
          <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
            Column
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map(row => (
          <tr key={row.id} className="hover:bg-surface transition-colors">
            <td className="px-4 py-3 text-sm text-text-primary">{content}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**Table with checkbox selection**:
- Checkbox column: `w-12 px-4`
- Row hover: `hover:bg-primary-light/30`
- Selected row: `bg-primary-light/20`

### 3.8 Modals

#### Structure
```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-[300] bg-[rgba(31,45,43,0.4)] backdrop-blur-sm animate-fade-in" />

{/* Content */}
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  className="fixed inset-0 z-[400] flex items-center justify-center p-4 pointer-events-none"
>
  <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto pointer-events-auto">
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface text-text-muted hover:text-text-primary">
        <X className="w-5 h-5" />
      </button>
    </div>
    {/* Body */}
    <div className="p-6">
      {/* Content */}
    </div>
    {/* Footer */}
    <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
      <Button variant="secondary">Hủy</Button>
      <Button variant="primary">Xác nhận</Button>
    </div>
  </div>
</motion.div>
```

#### Modal Sizes
| Name | Class | Usage |
|---|---|---|
| sm | `max-w-md` | Confirmation, small form |
| md | `max-w-lg` | Standard form, detail view |
| lg | `max-w-2xl` | Complex form, preview |
| xl | `max-w-4xl` | Full page in modal |
| full | `max-w-[90vw] max-h-[90vh]` | Large data tables |

### 3.9 Dropdowns

```tsx
<div className="relative">
  <button ref={triggerRef} onClick={() => setOpen(!open)}>
    Trigger
  </button>
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-border z-[50] py-1 overflow-hidden"
      >
        <DropdownItem icon={Item} label="Label" onClick={handler} />
        <DropdownItem icon={Item} label="Label" onClick={handler} danger />
        <div className="border-t border-border my-1" />
        <DropdownItem icon={Item} label="Label" onClick={handler} />
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

**`.dropdown-item`**:
```css
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-size: 14px;
  color: #5F7C76;
  cursor: pointer;
  transition: all 0.15s ease;
}
.dropdown-item:hover {
  background: #F7FAF9;
  color: #2E7D6B;
}
.dropdown-item.danger:hover {
  background: #FFEBEE;
  color: #DC2626;
}
```

### 3.10 Toast Notifications

```tsx
import { Toaster, toast } from 'react-hot-toast';

<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#1F2D2B',
      color: '#fff',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    },
    success: {
      iconTheme: { primary: '#4CAF8F', secondary: '#fff' },
    },
    error: {
      iconTheme: { primary: '#E57373', secondary: '#fff' },
    },
  }}
/>
```

### 3.11 Empty States

```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
    <Icon className="w-8 h-8 text-primary" />
  </div>
  <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
  <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
  {action && <Button variant="primary">{action.label}</Button>}
</div>
```

### 3.12 Loading States

#### Skeleton Loader
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-surface rounded w-3/4" />
  <div className="h-4 bg-surface rounded w-1/2" />
</div>
```

```css
.skeleton {
  background: linear-gradient(90deg, #F0F5F3 25%, #E2ECE9 50%, #F0F5F3 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}
```

#### Spinner
```tsx
<div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
```

#### Progress Bar
```tsx
<div className="w-full h-2 bg-border rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
    style={{ width: `${progress}%` }}
  />
</div>
```

### 3.13 Tabs

```tsx
<div className="flex gap-1 p-1 bg-surface rounded-xl border border-border">
  {tabs.map(tab => (
    <button
      key={tab.key}
      onClick={() => setActive(tab.key)}
      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active === tab.key
          ? 'bg-white text-primary shadow-sm'
          : 'text-text-secondary hover:text-primary'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### 3.14 Progress Indicators (Exam/Assignment)

```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between text-sm">
    <span className="text-text-secondary">{label}</span>
    <span className="font-semibold text-text-primary">{count}/{total}</span>
  </div>
  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${percentage}%`, background: color }}
    />
  </div>
</div>
```

### 3.15 Avatar

```tsx
// Avatar with image
<div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
  <img src={url} alt={name} className="w-full h-full object-cover" />
</div>

// Avatar with initials fallback
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
  {initials}
</div>
```

**Avatar Sizes**: `w-6 h-6` (xs), `w-8 h-8` (sm), `w-10 h-10` (md), `w-12 h-12` (lg), `w-16 h-16` (xl)

### 3.16 Search & Filter Bar

```tsx
<div className="flex flex-col sm:flex-row gap-3 mb-4">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
    <input className="input-field pl-10" placeholder="Tìm kiếm..." />
  </div>
  <select className="input-field w-full sm:w-48">
    <option>Lọc theo...</option>
  </select>
</div>
```

---

## 4. Page Templates

### 4.1 List Page Template (Classes, Exams, Assignments)

```
┌─ Page Header ─────────────────────────────────────┐
│  Title                    [+ Thêm mới]             │
│  Breadcrumb / subtitle                               │
├─ Filter Bar ─────────────────────────────────────── ┤
│  [🔍 Search...              ] [Lọc ▼] [Sắp xếp ▼]  │
├─ Stats Row (optional) ───────────────────────────── ┤
│  [📊 5 lớp]  [👥 120 học sinh]  [📝 12 bài KT]     │
├─ Content Grid / Table ───────────────────────────── ┤
│  ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │  Card  │ │  Card  │ │  Card  │  ← Grid (1→2→3) │
│  └────────┘ └────────┘ └────────┘                  │
│  ── or ──                                           │
│  ┌──────┬──────────────┬────────┬────────┐         │
│  │ Col  │ Col         │ Col    │ Actions│         │
│  ├──────┼──────────────┼────────┼────────┤         │
│  │ Row  │              │        │ [⋮]   │         │
│  └──────┴──────────────┴────────┴────────┘         │
├─ Pagination ────────────────────────────────────────┤
│  Showing 1-10 of 45    [< 1 2 3 4 5 >]             │
└────────────────────────────────────────────────────┘
```

### 4.2 Detail Page Template (Class Detail)

```
┌─ Back Button ──────────────────────────────────────┐
│  ← Quay lại                                         │
├─ Page Header ───────────────────────────────────────┤
│  [Avatar] Class Name                    [⚙️] [🔗]   │
│  Class code • Created date                           │
├─ Tab Navigation ───────────────────────────────────┤
│  [Tổng quan] [Học sinh] [Bài tập] [Kiểm tra]       │
├─ Tab Content ───────────────────────────────────────┤
│  (Rendered based on active tab)                      │
└─────────────────────────────────────────────────────┘
```

### 4.3 Form Page Template (Create/Edit Exam)

```
┌─ Page Header ─────────────────────────────────────┐
│  ← Quay lại                                         │
│  Tiêu đề trang              [Lưu nháp] [Xuất bản] │
├─ Two Column Layout ────────────────────────────────┤
│  ┌─ Left (2/3) ─────┐  ┌─ Right (1/3) ──────────┐ │
│  │ Form Fields      │  │ Preview / Settings     │ │
│  │                  │  │ - Thời gian            │ │
│  │                  │  │ - Điểm số              │ │
│  │                  │  │ - Hiển thị đáp án     │ │
│  └──────────────────┘  └────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### 4.4 Dashboard Layout

```
┌─ Welcome Header ───────────────────────────────────┐
│  Xin chào, [Name]!                    [Date]       │
├─ Stats Grid (1→2→3→4 cols) ───────────────────────┤
│  [👥 Lớp học: 5]  [👨‍🎓 HS: 120]  [📝 Bài KT: 12] [📊...]
├─ Two Column Layout ────────────────────────────────┤
│  ┌─ Left (2/3) ───────────────┐ ┌─ Right (1/3) ─┐ │
│  │ Recent Activity             │ │ Calendar     │ │
│  │ - Class cards               │ │ Upcoming     │ │
│  │ - Exam overview             │ │ Notifications│ │
│  └─────────────────────────────┘ └──────────────┘ │
└────────────────────────────────────────────────────┘
```

---

## 5. Responsive Strategy

### 5.1 Breakpoint Implementation

| Breakpoint | Container | Grid | Card Grid | Navigation |
|---|---|---|---|---|
| `< sm` (default) | Full width, px-4 | 1 col | 1 col | Hamburger menu |
| `sm` (640px+) | px-6 | 2 col | 2 col | Hamburger menu |
| `md` (768px+) | px-6 | 3 col | 2 col | Nav pills (truncated) |
| `lg` (1024px+) | max-w-7xl, px-6 | 4 col | 3 col | Full nav pills |

### 5.2 Mobile-Specific UX

1. **Bottom navigation consideration**: For pages with frequent tab switching (e.g., Dashboard, Classes, Exams), consider a bottom tab bar on mobile instead of top nav
2. **Pull-to-refresh**: Implement for list pages
3. **Swipe actions**: On table rows (swipe left to delete/edit)
4. **Sticky action bar**: FAB (Floating Action Button) on list pages: `fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary shadow-lg`
5. **Horizontal scroll**: For badge/tag lists — no wrapping
6. **Touch targets**: Minimum 44x44px for all tap targets

### 5.3 Tablet Optimization

- Table view switches to card view at `md` breakpoint
- Side-by-side layout for form pages at `lg` breakpoint
- Expandable sidebar at `xl` breakpoint

---

## 6. Accessibility Guidelines

### 6.1 Keyboard Navigation
- All interactive elements reachable via Tab in logical order
- Focus order follows visual order
- Modal traps focus (FocusTrap from `@radix-ui/react-focus-swap` hoặc custom)
- Escape key closes modals/dropdowns
- Arrow keys navigate within tabs, menus, select

### 6.2 ARIA Patterns

| Component | ARIA Pattern |
|---|---|
| Button | `role="button"`, `aria-pressed` for toggles |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Dropdown | `role="menu"`, `role="menuitem"` |
| Tabs | `role="tablist"`, `role="tab"`, `aria-selected` |
| Table | `role="grid"` for interactive tables |
| Badge | `role="status"` for live status badges |
| Toast | `role="alert"`, `aria-live="polite"` |
| Loading | `aria-busy="true"`, `aria-label="Loading..."` |

### 6.3 Visual Accessibility
- Focus ring always visible: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- Error messages linked: `aria-describedby` trên input khi có lỗi
- Color không là cách duy nhất để truyền tải thông tin (luôn kèm icon/text)
- Minimum contrast 4.5:1 cho văn bản thường

---

## 7. Dark Mode Strategy (Future)

Khi cần hỗ trợ dark mode, áp dụng theo pattern:

```css
/* Light (default) */
:root {
  --bg-primary: #F7FAF9;
  --bg-surface: #FFFFFF;
  --text-primary: #1F2D2B;
  --border: #E2ECE9;
}

/* Dark */
.dark {
  --bg-primary: #0F1F1C;
  --bg-surface: #1A2E2B;
  --text-primary: #E6F4F1;
  --border: #2A3D39;
}
```

---

## 8. i18n Design

### 8.1 Translation Key Structure
```
nav.{page}           — Navigation labels
page.{name}.title    — Page title
page.{name}.subtitle — Page subtitle
page.{name}.action.{action} — Action buttons
page.{name}.field.{field}   — Form labels
page.{name}.placeholder.{field} — Placeholder text
page.{name}.error.{error}    — Error messages
page.{name}.empty.title      — Empty state title
page.{name}.empty.description — Empty state description
status.{status}     — Status labels (active, pending, etc.)
common.save         — Common labels (save, cancel, etc.)
```

### 8.2 Language Switcher Design
```tsx
<div className="relative">
  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface text-sm">
    {language === 'vi' ? '🇻🇳' : '🇺🇸'}
    <span>{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
    <ChevronDown className="w-4 h-4" />
  </button>
</div>
```

---

## 9. Component Inventory Summary

| Component | Status | File | Variants |
|---|---|---|---|
| `.card` | ✅ Defined | `index.css` | default, hover |
| `.card-hover` | ✅ Defined | `index.css` | interactive |
| `.btn-primary` | ✅ Defined | `index.css` | default, hover, active, disabled |
| `.btn-secondary` | ✅ Defined | `index.css` | default, hover |
| `.btn-outline` | ✅ Defined | `index.css` | default, hover |
| `.btn-danger` | ✅ Defined | `index.css` | default, hover |
| `.input-field` | ✅ Defined | `index.css` | default, focus, disabled, error |
| `.badge` | ✅ Defined | `index.css` | success, warning, error, info, default |
| `.nav-active` | ✅ Defined | `index.css` | — |
| `.nav-inactive` | ✅ Defined | `index.css` | — |
| `.skeleton` | ✅ Defined | `index.css` | — |
| `.toggle-switch` | ✅ Defined | `index.css` | default, green (ClassSettings) |
| `.glass` | ✅ Defined | `index.css` | — |
| `.modal-overlay` | ✅ Defined | `index.css` | — |
| `.modal-content` | ✅ Defined | `index.css` | — |
| `SoftCard` component | ⚠️ Partial | `SoftCard.tsx` | Primary (blue), Secondary, Outline, Ghost, Danger |
| `Badge` component | ⚠️ Partial | `SoftCard.tsx` | Same as CSS but blue primary |
| `EmptyState` component | ⚠️ Partial | `SoftCard.tsx` | — |
| `Avatar` component | ⚠️ Partial | `SoftCard.tsx` | Image, Initials |
| `Button` component | ⚠️ Partial | `SoftCard.tsx` | See SoftCard |
| `Input` component | ⚠️ Partial | `SoftCard.tsx` | Text, Textarea, Select |
| `Layout` component | ✅ Ready | `Layout.tsx` | — |
| `AvatarModal` component | ✅ Ready | `AvatarModal.tsx` | — |
| `LanguageSwitcher` component | ✅ Ready | `LanguageSwitcher.tsx` | — |
| `ConfirmDialog` component | ✅ Ready | `notificationController.ts` / use in pages | — |

### ⚠️ Known Inconsistencies to Fix

1. **Primary color mismatch**: `SoftCard.tsx` uses `#1E3A5F` (dark blue) for primary buttons, while the rest of the app uses `#2E7D6B` (teal). → Chọn 1 brand color và propagate to all components.

2. **Two card systems**: `.card` class in CSS vs `SoftCard` component with `rounded-2xl` and different shadow. → Thống nhất dùng `.card` CSS class system.

3. **Login page colors**: Hardcoded darker greens in Login page don't match Tailwind `primary` token. → Extract to Tailwind config.

---

## 10. Performance Guidelines

1. **Image optimization**: All images use `loading="lazy"`, explicit `width`/`height` to prevent layout shift
2. **Code splitting**: Route-level lazy loading with `React.lazy()` + `Suspense`
3. **Debounce search**: 300ms debounce on search input
4. **Virtual scrolling**: For tables/lists > 50 items
5. **Animation performance**: Prefer `transform` and `opacity` for animations (GPU-accelerated). Avoid `box-shadow` animation.
6. **Font loading**: `font-display: swap` in Google Fonts import

---

## 11. Animation Orchestration

### Page Load Sequence
```
0ms    → Page container fades in (opacity 0→1, 300ms)
50ms   → Page header slides down (translateY -16→0, 400ms)
100ms  → Stats cards stagger in (each 50ms delay)
150ms  → Main content cards stagger in (each 80ms delay)
```

### Micro-interactions Checklist
- [ ] Button: hover lift + shadow, press sink
- [ ] Card: hover lift + shadow, cursor pointer
- [ ] Input: focus ring animation
- [ ] Tab: smooth background transition
- [ ] Modal: backdrop fade + content scale-in
- [ ] Dropdown: height expand + fade
- [ ] Toast: slide in from right, fade out
- [ ] Skeleton: shimmer effect while loading
- [ ] Nav pill: smooth background fill
- [ ] Badge: appear with scale (0.8→1)

---

*Document version: 1.0 | Last updated: 2026-03-20*
