class MessengerAIChatCompenent extends HTMLElement {
  private input!: HTMLTextAreaElement;
  private display!: HTMLDivElement;
  private sendBtn!: HTMLButtonElement;
  private isResponding: boolean;
  private abortController: AbortController | null;
  private autoScroll: boolean;

  constructor() {
    super();
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
            <button id="send">Envoyer</button>
          </div>
        </div>
      </div>
    `;
    this.isResponding = false;
    this.abortController = null;
    this.loadStyles();
    this.autoScroll = true; // Nouvelle propriété pour suivre l'état du scroll
  }

  async loadStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .messenger-ai-container {
          width: 100%;
          max-width: 750px;  /* Réduit de 1000px à 750px */
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          transform: scale(1.1);
      }

      .messenger-ai-window {
          background: white;
          border: 1px solid #0055A5;
          border-radius: 8px;
          box-shadow: 2px 2px 15px rgba(0,0,0,0.2);
          overflow: hidden;
          min-width: 675px;  /* Réduit de 900px à 675px */
      }

      .messenger-ai-titlebar {
          background: linear-gradient(to right, #0055A5, #00A4E8);
          color: white;
          padding: 5px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
      }

      .messenger-ai-controls {
          display: flex;
          gap: 2px;
          margin-left: 8px;
      }

      .messenger-ai-controls span {
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 2px;
          font-family: "Segoe UI", sans-serif;
          font-size: 12px;
          transition: background-color 0.2s;
          user-select: none;
      }

      .messenger-ai-controls span:hover {
          background: rgba(255, 255, 255, 0.2);
      }

      .messenger-ai-controls .minimize {
          font-size: 11px;
          padding-top: 4px;
      }

      .messenger-ai-controls .maximize {
          font-size: 12px;
          padding-top: 3px;
      }

      .messenger-ai-controls .close {
          margin-left: 2px;
      }

      .messenger-ai-chat-area {
          height: 450px;  /* Réduit de 600px à 450px */
          overflow-y: auto;
          padding: 20px;
          background: #DAE7F5;  /* Couleur de fond messenger-ai classique */
          background-image: 
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200' opacity='0.05'%3E%3Cpath fill='%230055A5' d='M100.2 38c-17 0-31.5 10.7-37.1 25.8-5.5-4.3-12.5-6.9-20.1-6.9-18 0-32.6 14.6-32.6 32.6s14.6 32.6 32.6 32.6c7.6 0 14.6-2.6 20.1-6.9 5.6 15.1 20.1 25.8 37.1 25.8 17 0 31.5-10.7 37.1-25.8 5.5 4.3 12.5 6.9 20.1 6.9 18 0 32.6-14.6 32.6-32.6s-14.6-32.6-32.6-32.6c-7.6 0-14.6 2.6-20.1 6.9-5.6-15.1-20.1-25.8-37.1-25.8z'/%3E%3C/svg%3E"),
              linear-gradient(to bottom, #E8F1FA 0%, #DAE7F5 100%);
          background-size: 120px 120px, 100% 100%;
          background-position: center;
          background-repeat: no-repeat, repeat;
      }

      .messenger-ai-chat-area::-webkit-scrollbar {
          width: 18px;
          background: #E3EFF9;
          border-left: 1px solid #B8D6E6;
      }

      .messenger-ai-chat-area::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #00A4E8, #0078D4);
          border: 4px solid #E3EFF9;
          border-radius: 9px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3);
      }

      .messenger-ai-chat-area::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #0091CF, #0067B5);
      }

      .messenger-ai-chat-area::-webkit-scrollbar-track {
          background: linear-gradient(to right, #E3EFF9 0%, #F0F7FC 100%);
      }

      .message-container {
          margin: 16px 0;
          display: flex;
          flex-direction: column;
          max-width: 90%;
          animation: messageSlideIn 0.3s ease-out;
          opacity: 0;
          transform: translateY(20px);
          animation-fill-mode: forwards;
      }

      @keyframes messageSlideIn {
          from {
              opacity: 0;
              transform: translateY(20px);
          }
          to {
              opacity: 1;
              transform: translateY(0);
          }
      }

      .message-metadata {
          font-size: 11px;
          margin-bottom: 4px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          padding-left: 24px;
      }

      .message-metadata::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          background-size: contain;
          background-repeat: no-repeat;
      }

      .user-message-container .message-metadata::before {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%230078D4' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E");
      }

      .ai-message-container .message-metadata::before {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2334A853' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E");
      }

      .user-message-container .message-sender {
          color: #0078D4;
      }

      .ai-message-container .message-sender {
          color: #34A853;
      }

      .message-sender {
          font-weight: bold;
          color: #0055A5;
      }

      .message-time {
          color: #888;
      }

      .user-message-container {
          align-self: flex-end;
          align-items: flex-end;
          animation-name: messageSlideInRight;
      }

      .ai-message-container {
          align-self: flex-start;
          align-items: flex-start;
          animation-name: messageSlideInLeft;
      }

      @keyframes messageSlideInRight {
          from {
              opacity: 0;
              transform: translateX(50px);
          }
          to {
              opacity: 1;
              transform: translateX(0);
          }
      }

      @keyframes messageSlideInLeft {
          from {
              opacity: 0;
              transform: translateX(-50px);
          }
          to {
              opacity: 1;
              transform: translateX(0);
          }
      }

      .message {
          margin: 0;
          padding: 10px 14px;
          border-radius: 12px;
          position: relative;
          font-size: 15px;
          line-height: 1.4;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          background: white;
          border: 1px solid #B8D6E6;
      }

      @keyframes messageFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
      }

      .user-message-container .message {
          background:rgb(174, 211, 248);
          border: 1px solid #90CAF9;
          border-top-right-radius: 4px;
      }

      .ai-message-container .message {
          background: white;
          border: 1px solid #B8D6E6;
          border-top-left-radius: 4px;
      }

      .messenger-ai-input-area {
          padding: 10px;
          background: #F0F7FC;
          border-top: 1px solid #B8D6E6;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
      }

      textarea {
          width: calc(100% - 2px);
          height: 75px;  /* Réduit de 100px à 75px */
          padding: 8px;
          border: 1px solid #B8D6E6;
          border-radius: 4px;
          resize: none;
          font-family: inherit;
          font-size: 15px;
          margin-bottom: 8px;
          box-sizing: border-box;
          outline: none;
          background: white;
          color: rgb(24, 24, 24);
          font-weight: normal;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
      }

      textarea:focus {
          border-color: #00A4E8;
          box-shadow: 0 0 5px rgba(0,164,232,0.3);
          background: white;
      }

      button {
          background: linear-gradient(to bottom, #00A4E8, #0055A5);
          color: white;
          border: 1px solid #0055A5;
          border-radius: 3px;
          padding: 8px 25px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          align-self: flex-end;
          min-width: 90px;  /* Réduit de 120px à 90px */
      }

      button:hover {
          background: linear-gradient(to bottom, #0055A5, #00A4E8);
      }

      button:disabled {
        background: linear-gradient(to bottom, #93c9e5, #6896b5);
        border-color: #6896b5;
        cursor: not-allowed;
        opacity: 0.7;
      }

      button.cancel {
          background: linear-gradient(to bottom, #ff4d4d, #cc0000);
          border-color: #cc0000;
      }

      button.cancel:hover {
          background: linear-gradient(to bottom, #cc0000, #ff4d4d);
      }

      .message.user-message {
        margin-left: auto;
        background: rgb(254, 244, 229);
        border-color: #90CAF9;
      }

      .message.user-message::before {
          right: 8px;
          background: #E3F2FD;
          color: #1565C0;
      }

      .message.ai-message {
        margin-right: auto;
        background: rgb(202, 224, 255);
      }

      .message.ai-message::before {
          left: 8px;
          background: #E8F5FF;
          color: #00498F;
      }

      .loading {
        margin-right: auto;
        padding: 8px 16px;
      }

      .loading .dot {
        animation: loadingDots 1.5s infinite;
        opacity: 0;
      }

      .loading .dot:nth-child(2) { animation-delay: 0.5s; }
      .loading .dot:nth-child(3) { animation-delay: 1s; }

      @keyframes loadingDots {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    
    this.shadowRoot?.insertBefore(styleElement, this.shadowRoot.firstChild);
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
      // Annulation de la réponse en cours
      this.abortController?.abort();
      this.isResponding = false;
      this.sendBtn.textContent = 'Envoyer';
      this.sendBtn.classList.remove('cancel');
      this.input.disabled = false;
      return;
    }
    
    const promptText = this.input.value.trim();
    if (promptText === '') return;
    
    // Préparation pour l'envoi
    this.sendBtn.textContent = 'Annuler';
    this.sendBtn.classList.add('cancel');
    this.input.disabled = true;
    
    // Ajouter le message de l'utilisateur
    this.ajouterMessage(promptText, 'user-message');
    this.input.value = '';
    
    // Simuler la réponse avec possibilité d'annulation
    this.isResponding = true;
    this.abortController = new AbortController();
    this.montrerIndicateurChargement();
    
    try {
      await this.simulerReponse(promptText, this.abortController.signal);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        const loadingElem = this.shadowRoot?.querySelector('.loading');
        if (loadingElem) loadingElem.remove();
        this.ajouterMessage('Message interrompu', 'ai-message');
      }
    } finally {
      // Réinitialisation de l'interface
      this.isResponding = false;
      this.abortController = null;
      this.sendBtn.textContent = 'Envoyer';
      this.sendBtn.classList.remove('cancel');
      this.input.disabled = false;
      this.input.focus();
    }
  }

  private ajouterMessage(message: string, type: string = ''): void {
    const containerElem = document.createElement('div');
    containerElem.className = `message-container ${type}-container`;

    const metadataElem = document.createElement('div');
    metadataElem.className = 'message-metadata';
    
    const senderElem = document.createElement('span');
    senderElem.className = 'message-sender';
    senderElem.textContent = type === 'user-message' ? 'VOUS' : 'IA';
    
    const timeElem = document.createElement('span');
    timeElem.className = 'message-time';
    const now = new Date();
    timeElem.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    metadataElem.appendChild(senderElem);
    metadataElem.appendChild(timeElem);

    const messageElem = document.createElement('div');
    messageElem.className = `message ${type}`;
    messageElem.textContent = message;

    containerElem.appendChild(metadataElem);
    containerElem.appendChild(messageElem);
    this.display.appendChild(containerElem);
    this.display.scrollTop = this.display.scrollHeight;
    this.autoScroll = true; // Réinitialiser l'auto-scroll pour les nouveaux messages
  }

  private montrerIndicateurChargement(): void {
    const loadingElem = document.createElement('div');
    loadingElem.className = 'message loading';
    loadingElem.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    this.display.appendChild(loadingElem);
    this.display.scrollTop = this.display.scrollHeight;
  }

  private async simulerReponse(prompt: string, signal: AbortSignal): Promise<void> {
    const loading = this.shadowRoot?.querySelector('.loading');
    if (loading) loading.remove();

    const reponse = this.genererReponseSimulee(prompt);
    
    // Créer le conteneur de message avec métadonnées
    const containerElem = document.createElement('div');
    containerElem.className = 'message-container ai-message-container';

    // Ajouter les métadonnées (sender + time)
    const metadataElem = document.createElement('div');
    metadataElem.className = 'message-metadata';
    
    const senderElem = document.createElement('span');
    senderElem.className = 'message-sender';
    senderElem.textContent = 'IA';
    
    const timeElem = document.createElement('span');
    timeElem.className = 'message-time';
    const now = new Date();
    timeElem.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    metadataElem.appendChild(senderElem);
    metadataElem.appendChild(timeElem);
    containerElem.appendChild(metadataElem);

    // Ajouter le message
    const messageElem = document.createElement('div');
    messageElem.className = 'message ai-message';
    containerElem.appendChild(messageElem);

    // Ajouter le conteneur au chat
    this.display.appendChild(containerElem);

    // Ajouter les gestionnaires d'événements pour le scroll
    const handleScroll = () => {
      const {scrollTop, scrollHeight, clientHeight} = this.display;
      // Désactiver l'auto-scroll si l'utilisateur remonte manuellement
      this.autoScroll = scrollHeight - scrollTop - clientHeight < 50;
    };

    this.display.addEventListener('scroll', handleScroll);

    // Streaming simulé avec scroll intelligent
    for (let i = 0; i < reponse.length; i++) {
      if (signal.aborted) {
        this.display.removeEventListener('scroll', handleScroll);
        throw new DOMException('Réponse annulée', 'AbortError');
      }
      messageElem.textContent += reponse[i];
      
      // Scroll uniquement si l'auto-scroll est actif
      if (this.autoScroll) {
        this.display.scrollTo({
          top: this.display.scrollHeight,
          behavior: 'smooth'
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
    }

    // Nettoyage
    this.display.removeEventListener('scroll', handleScroll);
  }

  private genererReponseSimulee(prompt: string): string {
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
