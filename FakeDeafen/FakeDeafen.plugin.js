/**
 * @name FakeDeafen
 * @description Lets you appear deafened while still being able to hear and talk
 * @version 0.4
 * @autor Sleek
 * @authorId 153253064231354368
 * @invite B5kBdSsED2
 * @license Unlicensed
 * @website https://sleek.blackbox.sh/
 * @source https://github.com/s4dic/BetterDiscord/tree/main/FakeDeafen
 * @updateUrl https://raw.githubusercontent.com/s4dic/BetterDiscord/main/FakeDeafen/FakeDeafen.plugin.js
 */

module.exports = class FakeDeafen {
    constructor(meta) {
        this.meta = meta;
        this.mySettings = { shiftKeyRequired: false, triggerKey: "d" };
        this.isActive = false;

        this.myButton = document.createElement("button");
        this.myButton.textContent = "Toggle Fake Deafen";
        this.myButton.addEventListener("click", () => { this.toggleDeafen(); });

        this.myButton.style.width = "150px";
        this.myButton.style.height = "40px";
        this.myButton.style.fontSize = "12px";

        const muteButton = document.querySelector('[aria-label="Mute"]');
        if (muteButton) {
            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("button-container");
            buttonContainer.appendChild(this.myButton);

            muteButton.parentNode.insertBefore(buttonContainer, muteButton.nextSibling);
        }

        // Save the original send method
        WebSocket.prototype.originalSend = WebSocket.prototype.send;
    }

    toggleDeafen() {
        if (!this.isActive) {
            WebSocket.prototype.send = function(data) {
                const glob = new TextDecoder("utf-8");
                if (Object.prototype.toString.call(data) === "[object ArrayBuffer]") {
                    if (glob.decode(data).includes("self_deaf")) {
                        data = data.replace('"self_mute":false');
                    }
                }
                WebSocket.prototype.originalSend.apply(this, [data]);
            };
            BdApi.UI.showToast("Fake Deafen Activated", {type: "success"});
            BdApi.showToast("Fake Deafen Activated", {type: "success"});
            this.isActive = true;
        } else {
            WebSocket.prototype.send = WebSocket.prototype.originalSend;
            BdApi.UI.showToast("Fake Deafen Deactivated", {type: "warning"});
            BdApi.showToast("Fake Deafen Deactivated", {type: "warning"});
            this.isActive = false;
        }
    }

    start() {
        // Load settings
        Object.assign(this.mySettings, BdApi.Data.load(this.meta.name, "settings"));
        document.addEventListener("keydown", this.handleKeyDown.bind(this));

        // Check if required library is downloaded and prompt the user to download it if it isn't
        if (!global.ZeresPluginLibrary) {
            BdApi.UI.showConfirmationModal(
                "Library Missing",
                `The library plugin needed for ${this.meta.name} is missing. Please click Download Now to install it.`,
                {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onConfirm: () => {
                        require("request").get(
                            "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                            async (error, response, body) => {
                                if (error)
                                    return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                                await new Promise((r) =>
                                    require("fs").writeFile(
                                        require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"),
                                        body,
                                        r
                                    )
                                );
                            }
                        );
                    },
                }
            );
        }
    }

    handleKeyDown(event) {
        if ((this.mySettings.shiftKeyRequired && event.shiftKey || !this.mySettings.shiftKeyRequired && event.ctrlKey) && event.key.toLowerCase() === this.mySettings.triggerKey.toLowerCase()) {
            this.toggleDeafen();
        }
    }

    stop() {
        // Restore original WebSocket send method
        WebSocket.prototype.send = WebSocket.prototype.originalSend;
        this.myButton.remove();
        document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    }

    getSettingsPanel() {
        const panel = document.createElement("div");

        const triggerKeySetting = document.createElement("div");
        triggerKeySetting.innerHTML = `<label>Trigger Key: <input type="text" value="${this.mySettings.triggerKey}" /></label>`;
        triggerKeySetting.querySelector('input').onchange = (e) => {
            this.mySettings.triggerKey = e.target.value;
            BdApi.Data.save(this.meta.name, "settings", this.mySettings);
        };

        const shiftKeySetting = document.createElement("div");
        shiftKeySetting.innerHTML = `<label>Use Shift Key: <input type="checkbox" ${this.mySettings.shiftKeyRequired ? "checked" : ""}/></label>`;
        shiftKeySetting.querySelector('input').onchange = (e) => {
            this.mySettings.shiftKeyRequired = e.target.checked;
            BdApi.Data.save(this.meta.name, "settings", this.mySettings);
        };

        panel.appendChild(triggerKeySetting);
        panel.appendChild(shiftKeySetting);
        return panel;
    }
};
