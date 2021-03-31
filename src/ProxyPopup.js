import { html, LitElement, ScopedElementsMixin } from '@lion/core';
import { Pattern } from '@lion/form-core';
import { LionRadio, LionRadioGroup } from '@lion/radio-group';
import { LionInput } from '@lion/input';
import { LionCheckbox } from '@lion/checkbox-group';
import { LionButton } from '@lion/button';

import styles from './ProxyPopup.style.js';

const proxyPattern = new Pattern(/(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|.+\..{2,}):\d{2,5}/, {
    getMessage: () => 'Please enter a valid address (<address>:<port>)'
});

export class ProxyPopup extends ScopedElementsMixin(LitElement) {
    static get scopedElements() {
        return {
            'lion-radio-group': LionRadioGroup,
            'lion-radio': LionRadio,
            'lion-input': LionInput,
            'lion-checkbox': LionCheckbox,
            'lion-button': LionButton
        }
    }

    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            httpProxyAll: { type: Boolean },
            error: { type: String}
        }
    }

    constructor() {
        super();

        this.error = "";
        this.settings = {};
        this.setSettings = this.setSettings.bind(this);
        this.setPrivateAllowed = this.setPrivateAllowed.bind(this);
        
        browser.proxy.settings.get({}).then(result => {
            this.setSettings(result.value);
        });

        browser.extension.isAllowedIncognitoAccess().then(value => {
            this.setPrivateAllowed(value);
        });
    }

    setSettings(settings) {
        const { httpProxyAll } = settings;
        this.httpProxyAll = httpProxyAll;
        this.settings = settings;
        this.requestUpdate();
    }

    setPrivateAllowed(value) {
        this.privateAllowed = value;
        this.requestUpdate();
    }

    changeSetting(changeEvent) {
        this.error = '';

        const newValue = changeEvent.srcElement.value;

        browser.proxy.settings.get({}).then(result => {
            const newSettings = {
                ...result.value,
                proxyType: newValue
            };
            
            if ( newValue !== 'autoConfig' || result.value.autoConfigUrl) {
                browser.proxy.settings.set({
                    "value": newSettings
                });
            } else {
                this.error = 'the config URL is required for Auto Configure'
            }

            this.setSettings(newSettings);
        });
    }

    saveManualSettings() {
        browser.proxy.settings.get({}).then(result => {
            const http = this.shadowRoot.getElementById('httpProxy').modelValue;
            const ssl = this.shadowRoot.getElementById('httpsProxy').modelValue;
            const ftp = this.shadowRoot.getElementById('ftpProxy').modelValue;
            const socks = this.shadowRoot.getElementById('socksProxy').modelValue;
            const httpProxyAll = this.shadowRoot.getElementById('httpProxyAll').checked;

            const newSettings = {
                ...result.value,
                http,
                ssl,
                ftp,
                socks,
                httpProxyAll
            };

            browser.proxy.settings.set({
                "value": newSettings
            });
            this.setSettings(newSettings);
        });
    }

    saveConfigURL() {
        this.error = '';

        browser.proxy.settings.get({}).then(result => {
            const autoConfigUrl = this.shadowRoot.getElementById('autoProxyConfURL').modelValue;

            const newSettings = {
                ...result.value,
                proxyType: 'autoConfig',
                autoConfigUrl
            };
            
            if (autoConfigUrl.length > 0) {
                browser.proxy.settings.set({
                    "value": newSettings
                }).catch(e => {
                    console.log(e);
                    this.error = e.message;
                });
            } else {
                this.error = 'the config URL is required for Auto Configure'
            }

            this.setSettings(newSettings);
        });
    }

    render() {
        return html`
            ${this.privateAllowed ? this.renderSelector() : this.renderPrivateWarning()}
        `;
    }

    renderSelector() {
        return html`
            <p class="warning" >${this.error}</p>
            <lion-radio-group name='proxySettings' label='What setting do you want?' @change=${this.changeSetting}>
                <lion-radio label='Off' .choiceValue=${'none'} ?checked=${this.settings.proxyType === 'none'}></lion-radio>
                <lion-radio label='System' .choiceValue=${'system'} ?checked=${this.settings.proxyType === 'system'}></lion-radio>
                <lion-radio label='Manual' .choiceValue=${'manual'} ?checked=${this.settings.proxyType === 'manual'}></lion-radio>
                <lion-radio label='Auto Detect' .choiceValue=${'autoDetect'} ?checked=${this.settings.proxyType === 'autoDetect'}></lion-radio>
                <lion-radio label='Auto Configure' .choiceValue=${'autoConfig'} ?checked=${this.settings.proxyType=== 'autoConfig'}></lion-radio>
            </lion-radio-group>
            ${this.settings.proxyType === 'manual' ? this.renderManualProxyInput() : ''}
            ${this.settings.proxyType === 'autoConfig' ? this.renderAutomaticProxyConfig() : ''}
        `;
    }

    renderManualProxyInput() {
        return html`
            <div class="manualProxyInput">
                <p>Manual proxy settings</p>
                <lion-input .validators=${[proxyPattern]} id='httpProxy' label='HTTP Proxy' .modelValue=${this.settings.http}></lion-input>
                <lion-checkbox id='httpProxyAll' label='Use HTTP Proxy for all protocols' .checked=${this.settings.httpProxyAll} @change=${(e) => this.httpProxyAll = e.target.checked}></lion-checkbox>
                <lion-input .validators=${[proxyPattern]} id='httpsProxy' label='HTTPS Proxy' .modelValue=${this.settings.ssl} ?hidden=${this.httpProxyAll}></lion-input>
                <lion-input .validators=${[proxyPattern]} id='ftpProxy' label='FTP Proxy' .modelValue=${this.settings.ftp} ?hidden=${this.httpProxyAll}></lion-input>
                <lion-input .validators=${[proxyPattern]} id='socksProxy' label='SOCKS Host' .modelValue=${this.settings.socks}></lion-input>
                <lion-button @click=${this.saveManualSettings}>Save</lion-button>
            </div>
        `;
    }

    renderAutomaticProxyConfig() {
        return html`
            <div class="autoProxyConfInput">
                <lion-input id='autoProxyConfURL' label='Automatic proxy configuration URL' .modelValue=${this.settings.autoConfigUrl}></lion-input>
                <lion-button @click=${this.saveConfigURL}>Reload</lion-button>
            </div>
        `;
    }

    renderPrivateWarning() {
        return html`
            <p class="warning">For this Add-on to work. It must be allowed in private windows</p>
            <p class="warning">Go to 'Add-ons', click 'Manage' on this addon and Allow 'Run in Private Windows'</p>
        `;
    }
}