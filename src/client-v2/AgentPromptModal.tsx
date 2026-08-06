import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { App, Button, Flex, Input, Modal, Typography, message as staticMessage, theme } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { buildAgentPrompt, buildApiBaseUrl, buildPortalLiveUrl } from '../shared/agentPrompt';
import { copyText } from './copyText';
import {
  BASE_URL_STORAGE_KEY,
  DEFAULT_ENV_NAME,
  ENV_NAME_STORAGE_KEY,
  readStored,
  writeStored,
  type PortalRecord,
} from './promptSettings';

const COPIED_FEEDBACK_MS = 2000;

export type AgentPromptModalProps = {
  portal: PortalRecord | null;
  /** Address detected by the server or the browser, used until someone types one. */
  detectedBaseUrl: string;
  /** Whether the detected address came from PORTAL_AGENT_PUBLIC_URL. */
  fromEnvironment: boolean;
  appScope: string;
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
};

/**
 * The prompt for one portal, with the two things that change it.
 *
 * The address lives here rather than on a settings page because it is only ever
 * questioned at this moment: the reader is about to hand the text to someone
 * else, which is when "is this address reachable from outside?" becomes a real
 * question. Whatever is typed is remembered for the next portal.
 */
export function AgentPromptModal(props: AgentPromptModalProps) {
  const { portal, detectedBaseUrl, fromEnvironment, appScope, open, onClose, t } = props;
  const { token } = theme.useToken();
  // App.useApp() is the themed one, but it only exists under antd's <App>; the
  // static export keeps the feedback working wherever this modal is mounted.
  const message = App.useApp()?.message || staticMessage;
  const [copied, setCopied] = useState(false);
  const [baseUrlOverride, setBaseUrlOverride] = useState(() => readStored(BASE_URL_STORAGE_KEY));
  const [envName, setEnvName] = useState(() => readStored(ENV_NAME_STORAGE_KEY) || DEFAULT_ENV_NAME);

  const baseUrl = baseUrlOverride || detectedBaseUrl;
  const prompt = useMemo(() => {
    if (!portal) {
      return '';
    }
    return buildAgentPrompt({
      appTitle: portal.title || portal.portalName || portal.uid,
      liveUrl: buildPortalLiveUrl({ baseUrl, appScope, routePath: portal.routePath || '' }),
      apiBaseUrl: buildApiBaseUrl({ baseUrl, appScope }),
      portalName: portal.portalName || portal.routePath?.replace(/^\/+/, '') || portal.uid,
      envName: envName.trim() || DEFAULT_ENV_NAME,
    });
  }, [appScope, baseUrl, envName, portal]);

  const handleCopy = useCallback(async () => {
    if (!(await copyText(prompt))) {
      message.error(t('Copy failed, select the text and copy it by hand'));
      return;
    }
    setCopied(true);
    message.success(t('Prompt copied. Paste it into your coding agent.'));
    window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }, [message, prompt, t]);

  return (
    <Modal
      open={open}
      width={token.screenMD}
      title={portal ? `${t('Connect coding agent')} - ${portal.title || portal.portalName}` : t('Connect coding agent')}
      onCancel={onClose}
      afterClose={() => setCopied(false)}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('Close')}
        </Button>,
        <Button
          key="copy"
          type="primary"
          size="large"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
        >
          {copied ? t('Copied') : t('Copy prompt')}
        </Button>,
      ]}
    >
      <Typography.Paragraph type="secondary">
        {t('Paste this into your coding agent. It connects to this instance and pulls the portal source.')}
      </Typography.Paragraph>
      <Flex gap={token.margin} wrap style={{ marginBottom: token.margin }}>
        <div style={{ flex: '2 1 320px', minWidth: 0 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: token.marginXXS }}>
            {t('Instance address')}
          </Typography.Text>
          <Input
            value={baseUrl}
            onChange={(event) => {
              const value = event.target.value;
              setBaseUrlOverride(value);
              writeStored(BASE_URL_STORAGE_KEY, value);
            }}
            placeholder={detectedBaseUrl}
          />
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {fromEnvironment
              ? t('Taken from the PORTAL_AGENT_PUBLIC_URL environment variable.')
              : t('Detected from this browser. Behind a tunnel or proxy, type the public address instead.')}
          </Typography.Text>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: token.marginXXS }}>
            {t('CLI environment name')}
          </Typography.Text>
          <Input
            value={envName}
            onChange={(event) => {
              const value = event.target.value;
              setEnvName(value);
              writeStored(ENV_NAME_STORAGE_KEY, value);
            }}
            placeholder={DEFAULT_ENV_NAME}
          />
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {t('The name the agent registers this instance under.')}
          </Typography.Text>
        </div>
      </Flex>
      <pre
        style={{
          background: token.colorFillQuaternary,
          borderRadius: token.borderRadius,
          fontSize: token.fontSizeSM,
          margin: 0,
          maxHeight: '45vh',
          overflow: 'auto',
          padding: token.padding,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {prompt}
      </pre>
    </Modal>
  );
}

export default AgentPromptModal;
