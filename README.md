# Messenger AI Chat

A modern chat interface inspired by MSN Messenger, integrating conversational AI.

## 🌟 Features

- Nostalgic MSN Messenger-inspired UI
- Custom Web Component
- Real-time responses with streaming effect
- Responsive and adaptive design
- Dark mode support
- Smooth animations and ergonomics
- Smart auto-scroll management
- Ability to cancel ongoing responses

## 🛠️ Technologies

- TypeScript
- Web Components
- Shadow DOM
- CSS3 with animations
- HTML5

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/messenger-ai-chat-chat.git

# Navigate to folder
cd messenger-ai-chat-chat

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🚀 Usage

```typescript
// Import component
import './messenger-ai-chat';

// Use in your HTML
<messenger-ai-chat></messenger-ai-chat>
```

## 🎨 Customization

The component can be customized via CSS:

```css
messenger-ai-chat {
    --msn-primary-color: #0055A5;
    --msn-secondary-color: #00A4E8;
    --msn-background: #DAE7F5;
}
```

## 🔧 API

### Events

- `message`: Emitted when a new message is sent
- `response`: Emitted when a response is received
- `typing`: Emitted during typing simulation

### Methods

- `sendMessage(text: string)`: Sends a message
- `clearChat()`: Clears history
- `toggleDarkMode()`: Toggles dark mode


## 📝 License

Distributed under the MIT License.

## 👥 Author

**Yani IDOUGHI** - [GitHub](https://github.com/yid0)
