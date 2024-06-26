/**
 * @name MentionLogger
 * @description Records all hidden mentions / Pings
 * @author Sleek
 * @authorId 153253064231354368
 * @version 1.1.1
 * @invite B5kBdSsED2
 * @license Unlicensed
 * @website https://sleek.blackbox.sh/
 * @source https://github.com/s4dic/BetterDiscord/tree/main/mentionlogger
 * @updateUrl https://raw.githubusercontent.com/s4dic/BetterDiscord/main/mentionlogger/mentionlogger.plugin.js
 */

module.exports = class MentionLogger {
    constructor() {
        this.pluginName = "MentionLogger";
        this.defaultSettings = { mentions: [] };
        this.settings = this.loadSettings();
    }

    load() { 
        this.start(); 
    }

    start() {
        console.log(`${this.pluginName} started`);
        this.initializePlugin();
    }

    initializePlugin() {
        const Dispatcher = BdApi.findModuleByProps("dispatch", "subscribe");
        this.dispatchToken = Dispatcher.subscribe("MESSAGE_CREATE", (e) => {
            const message = e.message;
            const currentUser = BdApi.findModuleByProps("getCurrentUser").getCurrentUser();
            if (message && message.mentions && message.mentions.some(mention => mention.id === currentUser.id)) {
                console.log('Mention detected:', message);
                this.logMention(message);
            }
        });
    }

    logMention(message) {
        const mentionDetails = {
            authorUsername: message.author.username,
            authorGlobalName: message.author.globalName || message.author.username,
            authorId: message.author.id, // Ensure the author's ID is captured here
            content: message.content,
            messageId: message.id,
            timestamp: new Date(message.timestamp).toLocaleString(),
            channelId: message.channel_id,
            guildId: message.guild_id
        };

        // Check to avoid duplicate records
        const isDuplicate = this.settings.mentions.some(mention => mention.messageId === mentionDetails.messageId);
        if (!isDuplicate) {
            this.settings.mentions.push(mentionDetails);
            this.saveSettings();
            console.log('Mention details saved:', mentionDetails);
        } else {
            console.log('Mention already recorded, ignored:', mentionDetails);
        }
    }

    stop() {
        const Dispatcher = BdApi.findModuleByProps("dispatch", "subscribe");
        if (this.dispatchToken) {
            Dispatcher.unsubscribe(this.dispatchToken);
        }
        BdApi.Patcher.unpatchAll(this.pluginName);
        console.log(`${this.pluginName} stopped`);
    }

    loadSettings() {
        // Load saved settings or use default settings if none are found
        return BdApi.loadData(this.pluginName, "settings") || this.defaultSettings;
    }

    saveSettings() {
        // Save the current settings of the plugin
        BdApi.saveData(this.pluginName, "settings", this.settings);
    }

    getSettingsPanel() {
    const panel = document.createElement("div");
    panel.style.userSelect = "text";

    const title = document.createElement("h3");
    title.innerText = "Mentions History";
    title.style.color = "#ff0000";
    panel.appendChild(title);

    const mentionsList = document.createElement("div");
    mentionsList.style.userSelect = "text";

    const reversedMentions = [...this.settings.mentions].reverse();

    reversedMentions.forEach((mention, index) => {
        const mentionEl = document.createElement("div");

        // Utilisez directement le timestamp tel quel du fichier de configuration
        const formattedDate = mention.timestamp; // Directement utilisé sans transformation

        // Supprimez la mention de l'utilisateur du contenu et corrigez les doubles espaces
        const contentWithoutMention = mention.content.replace(/<@\d+>/g, "").replace(/\s{2,}/g, ' ').trim();

        mentionEl.innerHTML = `
            <strong style="color: #00FF00;">Mention ${reversedMentions.length - index}:</strong><br>
            <span style="color: #00FF00;">Unique ID:</span> <span style="color: #ff0000;">&lt;@${mention.authorId}&gt;</span><br>
            <span style="color: #00FF00;">Mention Channel:</span> <span style="color: #ffff00;">&lt;#${mention.channelId}&gt;</span><br>
            <span style="color: #00FF00;">Discord Username:</span> <span style="color: #ffffff;">${mention.authorUsername}</span><br>
            <span style="color: #00FF00;">Author:</span> <span style="color: #ffffff;">${mention.authorGlobalName}</span><br>
            <span style="color: #00FF00;">Timestamp:</span> <span style="color: #ffffff;">${formattedDate}</span><br>
            <span style="color: #00FF00;">Mention Content:</span> <span style="color: #ffffff;">${contentWithoutMention}</span><br>
            <br>
        `;
        mentionsList.appendChild(mentionEl);
    });
    panel.appendChild(mentionsList);

    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear mentions history";
    clearButton.onclick = () => {
        this.settings.mentions = [];
        this.saveSettings();
        while (mentionsList.firstChild) mentionsList.removeChild(mentionsList.firstChild);
    };
    panel.appendChild(clearButton);

    return panel;
    }
};
