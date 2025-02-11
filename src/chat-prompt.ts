import { ApiHandler } from "./api-handler";
import { EnvType } from "./types";

class MessengerAIChatCompenent extends HTMLElement {
  private input!: HTMLTextAreaElement;
  private display!: HTMLDivElement;
  private sendBtn!: HTMLButtonElement;
  private isResponding: boolean;
  private abortController: AbortController | null;
  private autoScroll: boolean;
  private apiHandler: ApiHandler | null;
  private environment!: EnvType;

  static get observedAttributes() {
    return ['api-url', 'api-key', 'model']; 
  }

  constructor() {
    super();
    this.apiHandler = null;
    this.attachShadow({ mode: 'open' });
    if (!this.shadowRoot) {
      console.error('Impossible de créer le composant sans Shadow DOM.');
    }
    
    this.shadowRoot!!.innerHTML = `
      <div class="messenger-ai-container">
        <div class="messenger-ai-window">
          <div class="messenger-ai-titlebar">
            <div class="messenger-ai-title">Messenger AI chat</div>
            <div class="messenger-ai-controls">
              <span class="minimize">―</span>
              <span class="maximize">❐</span>
              <span class="close">✕</span>
            </div>
          </div>
          <div id="display" class="messenger-ai-chat-area"></div>
          <div class="messenger-ai-input-area">
            <textarea id="input" placeholder="Tapez votre message..."></textarea>
            <button id="send">Send</button>
          </div>
        </div>
      </div>
    `;
    this.isResponding = false;
    this.abortController = null;
    this.loadStyles();
    this.autoScroll = true;
    
  }

  connectedCallback() {
    const apiUrl = this.getAttribute('api-url');
    const apiKey = this.getAttribute('api-key');
    const model = this.getAttribute('model') || 'gemma:2b';
    this.environment = this.getAttribute('environment') as EnvType;
    
    if (apiUrl && apiKey) {
      this.apiHandler = new ApiHandler({
        baseUrl: apiUrl,
        apiKey: apiKey,
        model: model, 
        environment: this.environment
      });
    } else {
      console.error('API configuration missing');
    }
  }

  async loadStyles() {
    try {
      const response = await fetch('/chat-prompt.css');
      if (!response.ok) {
        throw new Error(`Failed to load CSS: ${response.statusText}`);
      }
      const cssText = await response.text();
      
      const styleElement = document.createElement('style');
      styleElement.textContent = cssText;
      
     
      if (this.shadowRoot?.firstChild) {
        this.shadowRoot.insertBefore(styleElement, this.shadowRoot.firstChild);
      } else {
        this.shadowRoot?.appendChild(styleElement);
      }
    } catch (error) {
      console.error('Error loading CSS, falling back to default styles:', error);
      this.loadFallbackStyles();
    }
    
   
    this.initializeComponent();
  }

  loadFallbackStyles() {
    const fallbackStyles = `
      .container { 
        border: 1px solid #ccc; 
        padding: 10px; 
        max-width: 500px; 
      }
      #display { 
        height: 200px; 
        border: 1px solid #eee; 
        margin-bottom: 10px; 
      }
      textarea { width: 100%; }
    `;
    const styleElement = document.createElement('style');
    styleElement.textContent = fallbackStyles;
    this.shadowRoot?.insertBefore(styleElement, this.shadowRoot.firstChild);
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.input = this.shadowRoot?.getElementById('input') as HTMLTextAreaElement;
    this.display = this.shadowRoot?.getElementById('display') as HTMLDivElement;
    this.sendBtn = this.shadowRoot?.getElementById('send') as HTMLButtonElement;

    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.input.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
  }

  private async handleSend(): Promise<void> {
    if (this.isResponding) {

      this.abortController?.abort();
      this.isResponding = false;
      this.sendBtn.textContent = 'Send';
      this.sendBtn.classList.remove('cancel');
      this.input.disabled = false;
      return;
    }
    
    const promptText = this.input.value.trim();
    if (promptText === '') return;
    
    this.sendBtn.textContent = 'Stop';
    this.sendBtn.classList.add('cancel');
    this.input.disabled = true;
    
    this.ajouterMessage(promptText, 'user-message');
    this.input.value = '';
    
    this.isResponding = true;
    this.abortController = new AbortController();
    this.showLoading();
    
    try {
      await this.buildResponse(promptText, this.abortController.signal);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        const loadingElem = this.shadowRoot?.querySelector('.loading');
        if (loadingElem) loadingElem.remove();
        this.ajouterMessage('Message interrompu', 'ai-message');
      }
    } finally {
    
      this.isResponding = false;
      this.abortController = null;
      this.sendBtn.textContent = 'Send';
      this.sendBtn.classList.remove('cancel');
      this.input.disabled = false;
      this.input.focus();
    }
  }

  private getFormattedTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  }

  private ajouterMessage(message: string, type: string = ''): void {
    const containerElem = document.createElement('div');
    containerElem.className = `message-container ${type}-container`;

    const metadataElem = document.createElement('div');
    metadataElem.className = 'message-metadata';
    
    const senderElem = document.createElement('span');
    senderElem.className = 'message-sender';
    senderElem.textContent = type === 'user-message' ? 'VOUS' : 'AI';
    
    const timeElem = document.createElement('span');
    timeElem.className = 'message-time';
    timeElem.textContent = this.getFormattedTime();

    metadataElem.appendChild(senderElem);
    metadataElem.appendChild(timeElem);

    const messageElem = document.createElement('div');
    messageElem.className = `message ${type}`;
    messageElem.textContent = message;

    containerElem.appendChild(metadataElem);
    containerElem.appendChild(messageElem);
    this.display.appendChild(containerElem);
    this.display.scrollTop = this.display.scrollHeight;
    this.autoScroll = true;
  }

  private showLoading(): void {
    const loadingElem = document.createElement('div');
    loadingElem.className = 'message loading';
    loadingElem.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    this.display.appendChild(loadingElem);
    this.display.scrollTop = this.display.scrollHeight;
  }

  private async buildResponse(prompt: string, signal: AbortSignal): Promise<void> {
    const loading = this.shadowRoot?.querySelector('.loading');
    if (loading) loading.remove();

    if (!this.apiHandler) {
      console.error('API handler not initialized');
      return;
    }

  
    const containerElem = document.createElement('div');
    containerElem.className = 'message-container ai-message-container';

    const metadataElem = document.createElement('div');
    metadataElem.className = 'message-metadata';
    
    const senderElem = document.createElement('span');
    senderElem.className = 'message-sender';
    senderElem.textContent = 'AI';
    
    const timeElem = document.createElement('span');
    timeElem.className = 'message-time';
    timeElem.textContent = this.getFormattedTime();

    metadataElem.appendChild(senderElem);
    metadataElem.appendChild(timeElem);
    containerElem.appendChild(metadataElem);

    const messageElem = document.createElement('div');
    messageElem.className = 'message ai-message';
    containerElem.appendChild(messageElem);

    this.display.appendChild(containerElem);

    try {
      const stream = (this.environment === 'development') ? this.generateDemoReponse(prompt) : await this.apiHandler.generateResponse({
        prompt: prompt,
        maxTokens: 2000,
        temperature: 0.7
      }) as any;

      if (!stream) {
        throw new Error('Stream is null');
      }
      
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      let accumulatedText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done || signal.aborted) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed && typeof parsed.content === 'string') {

                accumulatedText += parsed.content;
                
                const formattedText = this.formatText(accumulatedText);
                messageElem.innerHTML = formattedText;

                if (this.autoScroll) {
                  this.display.scrollTo({
                    top: this.display.scrollHeight,
                    behavior: 'smooth'
                  });
                }
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Stream error:', error);
      messageElem.textContent = `Erreur API: ${error.message}`;
    }
  }

  private formatText(text: string): string {

    let formatted = text.replace(/\n/g, '<br>');
    
    formatted = formatted.replace(/([.,!?])/g, '$1 ');
    
    formatted = formatted.replace(/^[-•]\s*(.*?)$/gm, '<br>• $1');
    
    formatted = formatted.replace(/(\d+\.\s+[^\n]+)/g, '<strong>$1</strong>');
    
    return formatted;
  }

  private generateDemoReponse(prompt: string): string {
    if (["Bonjour", "Hi", "Hello", "Dear"].map(el =>el.toLocaleLowerCase())
      .includes(prompt.toLowerCase())) {
      return `Hello! 👋 

I'm your AI chat assistant. How can I help you today?

You can ask me any questions or just chat with me. I'm here to:

- Help you find information
- Answer your questions
- Have engaging conversations
- Assist with various topics

What would you like to discuss?`;
    }

    const reponses = [`In response to your question "${prompt}", let me develop a comprehensive analysis.


1. Historical Context:

Historically, this issue emerged in the 1990s with the advent of new technologies. Early research showed promising results, but it wasn't until the early 2000s that major breakthroughs occurred.


2. Current State of Knowledge:

Recent studies show significant evolution in our understanding of the subject. Researchers have identified several key factors that directly influence observed results. These discoveries have important implications for future developments.


3. Practical Applications:

In the real world, these concepts find numerous applications:

- Optimization of existing processes
- Development of new methodologies
- Improvement of systemic performance
- Integration into modern workflows


4. Future Perspectives:

Current trends suggest we're on the cusp of a new era in this field. Continuous technological innovations open up previously unexplored possibilities. Experts predict major developments in the next 5 to 10 years.


5. Important Considerations:

It is crucial to take into account several aspects:

- Scalability of proposed solutions
- Environmental impact
- Ethical implications
- Long-term sustainability


6. Recommendations:

Based on these elements, I suggest:

a) A progressive approach to implementation
b) Constant monitoring of results
c) Continuous adaptation to new discoveries
d) Close collaboration between stakeholders


7. Conclusion:

Your question raises essential points that deserve careful attention. Current research shows we're on the right track, but there's still much to explore and discover in this fascinating field.


8. To Learn More:

I invite you to consult the latest publications on the subject and follow ongoing developments in the scientific community. Constant innovations in this field promise exciting advances for the future.`];
    return reponses[0];
  }

  disconnectedCallback(): void {
    this.sendBtn.removeEventListener('click', () => this.handleSend());
  }
}

customElements.define('messenger-ai-chat', MessengerAIChatCompenent);