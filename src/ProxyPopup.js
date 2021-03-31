import { html, LitElement, ScopedElementsMixin } from '@lion/core';
import { LionRadio, LionRadioGroup } from '@lion/radio-group';

import styles from './ProxyPopup.style.js';

export class ProxyPopup extends ScopedElementsMixin(LitElement) {
    static get scopedElements() {
        return {
            'lion-radio-group': LionRadioGroup,
            'lion-radio': LionRadio
        }
    }

    static get styles() {
        return styles;
    }

    constructor() {
        super();

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
        this.settings = settings;
        this.requestUpdate();
    }

    setPrivateAllowed(value) {
        this.privateAllowed = value;
        this.requestUpdate();
    }

    changeSetting(changeEvent) {
        const newValue = changeEvent.srcElement.value;

        browser.proxy.settings.get({}).then(result => {
            const newSettings = {
                ...result.value,
                proxyType: newValue
            };

            browser.proxy.settings.set({
                "value": newSettings
            });
            this.setSettings(newSettings);
        });
    }

    render() {
        console.log(this.settings);
        return html`
            ${this.privateAllowed ? this.renderSelector() : this.renderPrivateWarning()}
        `;
    }

    renderSelector() {
        return html`
            <lion-radio-group name='proxySettings' label='What setting do you want?' @change=${this.changeSetting}>
                <lion-radio label='Off' .choiceValue=${'none'} ?checked=${this.settings.proxyType === 'none'}></lion-radio>
                <lion-radio label='System' .choiceValue=${'system'} ?checked=${this.settings.proxyType === 'system'}></lion-radio>
                <lion-radio label='Manual' .choiceValue=${'manual'} ?checked=${this.settings.proxyType === 'manual'}></lion-radio>
                <lion-radio label='Auto Detect' .choiceValue=${'autoDetect'} ?checked=${this.settings.proxyType === 'autoDetect'}></lion-radio>
                <lion-radio label='Auto Configure' .choiceValue=${'autoConfig'} ?checked=${this.settings.proxyType=== 'autoConfig'}></lion-radio>
            </lion-radio-group>
        `;
    }

    renderPrivateWarning() {
        return html`
            <p class="warning">For this Add-on to work. It must be allowed in private windows</p>
            <p class="warning">Go to 'Add-ons', click 'Manage' on this addon and Allow 'Run in Private Windows'</p>
        `;
    }
}