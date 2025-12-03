export function buildChildWindowHtml(url: string, websiteName?: string, websiteId?: string, partition?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${websiteName || 'WebTools'}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
          }
          /* 自定义标题栏样式 */
          .title-bar {
            height: 32px;
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0;
            -webkit-app-region: drag;
            user-select: none;
            flex-shrink: 0;
          }
          .title-bar-tabs {
            flex: 1;
            display: flex;
            align-items: center;
            height: 100%;
            overflow-x: auto;
            scrollbar-width: thin;
            min-width: 0;
          }
          .title-bar-tabs::-webkit-scrollbar {
            height: 4px;
          }
          .title-bar-tabs::-webkit-scrollbar-track {
            background: transparent;
          }
          .title-bar-tabs::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 2px;
          }
          .tab {
            height: 28px;
            padding: 0 12px;
            margin: 2px 2px 0 2px;
            background: #f5f5f5;
            border: 1px solid #d0d0d0;
            border-bottom: none;
            border-radius: 8px 8px 0 0;
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 12px;
            color: #333;
            transition: all 0.2s;
            position: relative;
            -webkit-app-region: no-drag;
            max-width: 200px;
            min-width: 80px;
          }
          .tab.active {
            background: #ffffff;
            border-color: #e0e0e0;
            color: #1890ff;
            font-weight: 500;
          }
          .tab:hover {
            background: #e8e8e8;
          }
          .tab-close {
            margin-left: 6px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.6;
            transition: all 0.2s;
            -webkit-app-region: no-drag;
          }
          .tab-close:hover {
            background: #ff4d4f;
            color: white;
            opacity: 1;
          }
          .tab-title {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            user-select: none;
          }
          .new-tab-btn {
            width: 28px;
            height: 28px;
            margin: 2px 4px 0 4px;
            border: 1px solid #d0d0d0;
            background: #f5f5f5;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            color: #666;
            transition: all 0.2s;
            -webkit-app-region: no-drag;
          }
          .new-tab-btn:hover {
            background: #e0e0e0;
            color: #1890ff;
          }
          .window-controls {
            display: flex;
            align-items: center;
            height: 100%;
            -webkit-app-region: no-drag;
            flex-shrink: 0;
          }
          .window-control {
            width: 46px;
            height: 32px;
            border: none;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          .window-control:hover {
            background: #e5e5e5;
          }
          .window-control:active {
            background: #cccccc;
          }
          .window-control.close:hover {
            background: #e81123;
          }
          .window-control.close:hover svg {
            stroke: white;
          }
          .window-control svg {
            width: 12px;
            height: 12px;
            stroke: #333;
            fill: none;
            stroke-width: 1.5;
          }
          /* 功能栏样式 */
          .toolbar {
            height: 42px;
            background: #f0f2f5;
            border-bottom: 1px solid #d9d9d9;
            display: flex;
            align-items: center;
            padding: 0 12px;
            gap: 12px;
            flex-shrink: 0;
          }
          .toolbar-section {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .toolbar-section-1 {
            flex: 1;
            min-width: 0;
          }
          .toolbar-section-2 {
            flex: 2;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .toolbar-section-3 {
            flex: 1;
            justify-content: flex-end;
          }
          .custom-buttons {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding: 4px 0;
          }
          /* Ant Design Vue 按钮样式 */
          .ant-btn {
            position: relative;
            display: inline-block;
            font-weight: 400;
            white-space: nowrap;
            text-align: center;
            background-image: none;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            user-select: none;
            touch-action: manipulation;
            height: 32px;
            padding: 4px 15px;
            font-size: 14px;
            border-radius: 6px;
            outline: 0;
            line-height: 1.5714285714285714;
            box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
          }
          .ant-btn:hover, .ant-btn:focus {
            color: #40a9ff;
            border-color: #40a9ff;
          }
          .ant-btn:active {
            color: #096dd9;
            border-color: #096dd9;
          }
          /* 主要按钮 */
          .ant-btn-primary {
            color: #fff;
            background: #1890ff;
            border-color: #1890ff;
            text-shadow: 0 -1px 0 rgba(0,0,0,0.12);
            box-shadow: 0 2px #0000000b;
          }
          .ant-btn-primary:hover, .ant-btn-primary:focus {
            color: #fff;
            background: #40a9ff;
            border-color: #40a9ff;
          }
          .ant-btn-primary:active {
            color: #fff;
            background: #096dd9;
            border-color: #096dd9;
          }
          /* 成功按钮 */
          .ant-btn-success {
            color: #fff;
            background: #52c41a;
            border-color: #52c41a;
            text-shadow: 0 -1px 0 rgba(0,0,0,0.12);
            box-shadow: 0 2px #0000000b;
          }
          .ant-btn-success:hover, .ant-btn-success:focus {
            color: #fff;
            background: #73d13d;
            border-color: #73d13d;
          }
          .ant-btn-success:active {
            color: #fff;
            background: #389e0d;
            border-color: #389e0d;
          }
          /* 默认按钮 */
          .ant-btn-default {
            color: rgba(0, 0, 0, 0.88);
            background: #ffffff;
            border-color: #d9d9d9;
          }
          .ant-btn-default:hover, .ant-btn-default:focus {
            color: #40a9ff;
            border-color: #40a9ff;
          }
          .ant-btn-default:active {
            color: #096dd9;
            border-color: #096dd9;
          }
          /* 自定义按钮样式 */
          .custom-button {
            composes: ant-btn ant-btn-primary;
            font-size: 12px;
            padding: 2px 8px;
            height: 24px;
            line-height: 1.2;
          }
          .add-button {
            composes: ant-btn ant-btn-primary;
            font-size: 12px;
            padding: 2px 8px;
            height: 24px;
            line-height: 1.2;
          }
          .tool-button {
            composes: ant-btn ant-btn-default;
            font-size: 12px;
            padding: 2px 8px;
            height: 24px;
            line-height: 1.2;
          }
          /* 导航按钮样式 */
          .url-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            padding: 0;
            min-height: 32px;
            overflow: hidden;
          }
          .url-input {
            flex: 1;
            padding: 6px 10px;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.88);
            min-width: 0;
            border: none;
            outline: none;
            background: transparent;
            width: 100%;
          }
          .url-input:focus {
            background: #fff;
          }
          .nav-buttons {
            display: flex;
            gap: 0;
            border-left: 1px solid #d9d9d9;
          }
          .nav-button {
            width: 32px;
            height: 32px;
            border: none;
            background: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
          }
          .nav-button:hover {
            background: #f5f5f5;
          }
          .nav-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .tool-buttons {
            display: flex;
            gap: 6px;
          }
          .webview-container {
            flex: 1;
            position: relative;
            overflow: hidden;
          }
          webview {
            width: 100%;
            height: 100%;
            border: none;
          }
          .app-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          /* 账号管理弹窗样式 */
          .account-modal-mask {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 999;
          }
          .account-modal-mask.show {
            display: flex;
          }
          .account-modal {
            width: 420px;
            max-width: calc(100% - 40px);
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            padding: 16px 20px 20px;
            box-sizing: border-box;
          }
          .account-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .account-modal-title {
            font-size: 16px;
            font-weight: 600;
            color: rgba(0, 0, 0, 0.88);
          }
          .account-modal-close {
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            padding: 4px;
          }
          .account-modal-toolbar {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 8px;
            margin-bottom: 12px;
          }
          .account-list {
            max-height: 260px;
            overflow-y: auto;
            border: 1px solid #f0f0f0;
            border-radius: 6px;
          }
          .account-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            border-bottom: 1px solid #f0f0f0;
          }
          .account-item:last-child {
            border-bottom: none;
          }
          .account-item-left {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }
          .account-name {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .account-tag-default {
            font-size: 11px;
            color: #52c41a;
            padding: 0 6px;
            border-radius: 10px;
            background: #f6ffed;
            border: 1px solid #b7eb8f;
          }
          .account-actions {
            display: flex;
            gap: 6px;
          }
          .account-small-btn {
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            background: #ffffff;
            padding: 2px 6px;
            font-size: 12px;
            cursor: pointer;
          }
          .account-small-btn:hover {
            color: #40a9ff;
            border-color: #40a9ff;
          }
          .account-small-btn-danger {
            border-color: #ff4d4f;
            color: #ff4d4f;
          }
          .account-small-btn-danger:hover {
            background: #fff1f0;
          }
          .account-empty {
            padding: 24px 12px;
            text-align: center;
            color: rgba(0, 0, 0, 0.45);
            font-size: 13px;
          }
          .account-input-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
          }
          .account-input {
            flex: 1;
            height: 28px;
            border-radius: 4px;
            border: 1px solid #d9d9d9;
            padding: 0 8px;
            font-size: 13px;
            outline: none;
          }
          .account-input:focus {
            border-color: #40a9ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          }
          .account-input-error {
            border-color: #ff4d4f;
          }
          .account-input-error-text {
            margin-top: 4px;
            font-size: 12px;
            color: #ff4d4f;
          }
          .account-modal-footer {
            margin-top: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          <!-- 自定义标题栏 -->
          <div class="title-bar">
            <div class="title-bar-tabs">
              <div class="tab active" id="default">
                <span class="tab-title">${websiteName || '新标签页'}</span>
                <span class="tab-close" id="closeTab">×</span>
              </div>
              <button class="new-tab-btn" id="newTabBtn" title="新标签页">+</button>
            </div>
            <div class="window-controls">
              <button class="window-control minimize" id="minimizeBtn" title="最小化">
                <svg viewBox="0 0 12 12">
                  <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1"/>
                </svg>
              </button>
              <button class="window-control maximize" id="maximizeBtn" title="最大化">
                <svg viewBox="0 0 12 12">
                  <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>
                </svg>
              </button>
              <button class="window-control close" id="closeBtn" title="关闭">
                <svg viewBox="0 0 12 12">
                  <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/>
                  <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="toolbar">
            <div class="toolbar-section toolbar-section-1">
              <div class="custom-buttons" id="customButtons">
                <!-- 自定义按钮将在这里动态生成 -->
              </div>
              <!-- 管理功能已移到首页 -->
            </div>
            <div class="toolbar-section toolbar-section-2">
              <div class="url-container">
                <input type="text" class="url-input" id="urlInput" value="${url}" spellcheck="false">
                <div class="nav-buttons">
                  <button class="nav-button" id="addBtn" title="新增">
                    <svg viewBox="64 64 896 896" focusable="false" data-icon="plus" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path><path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path></svg>
                  </button>
                  <button class="nav-button" id="reloadBtn" title="刷新">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <polyline points="1 20 1 14 7 14"></polyline>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                  </button>
                  <button class="nav-button" id="backBtn" title="上一页">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button class="nav-button" id="homeBtn" title="主页">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </button>
                  <button class="nav-button" id="forwardBtn" title="下一页">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="toolbar-section toolbar-section-3">
              <div class="tool-buttons">
                <button class="ant-btn ant-btn-default" id="switchBtn" title="切换" style="font-size: 12px; padding: 2px 8px; height: 24px;">切换</button>
              </div>
            </div>
          </div>
          <div class="webview-container">
            <webview id="webview" src="${url}" ${partition ? 'partition="' + partition + '"' : ''} nodeintegration="false" contextIsolation="true" webpreferences="contextIsolation=true,nodeIntegration=false" allowpopups="true" webSecurity="true"></webview>
          </div>
          <!-- 账号管理弹窗 -->
          <div class="account-modal-mask" id="accountModalMask">
            <div class="account-modal">
              <div class="account-modal-header">
                <div class="account-modal-title">添加账号</div>
                <button class="account-modal-close" id="accountModalClose">×</button>
              </div>
              <div class="account-modal-toolbar">
                <button class="ant-btn ant-btn-primary" id="accountAddBtn" style="font-size: 12px; padding: 2px 10px; height: 28px;">添加</button>
              </div>
              <div class="account-list" id="accountList"></div>
              <div class="account-modal-footer">
                <button class="ant-btn ant-btn-default" id="accountCancelBtn" style="font-size: 12px; padding: 2px 10px; height: 28px;">取消</button>
                <button class="ant-btn ant-btn-success" id="accountConfirmBtn" style="font-size: 12px; padding: 2px 10px; height: 28px;">确定</button>
              </div>
              <!-- 内部添加/编辑账号的输入区域 -->
              <div class="account-input-row" id="accountInputRow" style="display: none;">
                <input class="account-input" id="accountNameInput" placeholder="账号名称" />
                <button class="ant-btn ant-btn-primary" id="accountSaveBtn" style="font-size: 12px; padding: 0 10px; height: 28px;">保存</button>
              </div>
              <div class="account-input-error-text" id="accountNameError" style="display: none;">账号名称不能为空</div>
            </div>
          </div>
        </div>
        <script>
          const websiteId = '${websiteId || ''}';
          const webview = document.getElementById('webview');
          const accountModalMask = document.getElementById('accountModalMask');
          const accountModalClose = document.getElementById('accountModalClose');
          const accountAddBtn = document.getElementById('accountAddBtn');
          const accountList = document.getElementById('accountList');
          const accountCancelBtn = document.getElementById('accountCancelBtn');
          const accountConfirmBtn = document.getElementById('accountConfirmBtn');
          const accountInputRow = document.getElementById('accountInputRow');
          const accountNameInput = document.getElementById('accountNameInput');
          const accountNameError = document.getElementById('accountNameError');
          const accountSaveBtn = document.getElementById('accountSaveBtn');

          let accountState = {
            key: '',
            list: [],
            selectedAccountId: '',
            editingAccountId: '',
          };
          const backBtn = document.getElementById('backBtn');
          const forwardBtn = document.getElementById('forwardBtn');
          const homeBtn = document.getElementById('homeBtn');
          const reloadBtn = document.getElementById('reloadBtn');
          const switchBtn = document.getElementById('switchBtn');
          const urlInput = document.getElementById('urlInput');
          const addBtn = document.getElementById('addBtn');
          const minimizeBtn = document.getElementById('minimizeBtn');
          const maximizeBtn = document.getElementById('maximizeBtn');
          const closeBtn = document.getElementById('closeBtn');
          const closeTabBtn = document.getElementById('closeTab');
          const newTabBtn = document.getElementById('newTabBtn');
          const currentTab = document.getElementById('default');

          // 窗口控制功能 - 使用预加载的ipcRenderer
          minimizeBtn.addEventListener('click', () => {
            if (window.ipcRenderer) {
              window.ipcRenderer.send('window-control', 'minimize');
            }
          });

          maximizeBtn.addEventListener('click', () => {
            if (window.ipcRenderer) {
              window.ipcRenderer.send('window-control', 'maximize');
            }
          });

          closeBtn.addEventListener('click', () => {
            if (window.ipcRenderer) {
              window.ipcRenderer.send('window-control', 'close');
            }
          });

          // 默认标签页的关闭按钮事件
          closeTabBtn.addEventListener('click', () => {
            closeTab('default'); // 使用统一的标签页关闭函数
          });

          // 标签页管理
          let tabs = [];
          let activeTabId = null;

          // 新建标签页功能
          newTabBtn.addEventListener('click', () => {
            try {
              // 使用首页URL创建新标签页，而不是当前URL
              const homeUrl = '${url}';
              createNewTab(homeUrl, '新标签页');
            } catch (error) {
              console.error('Error creating new tab:', error);
              // 使用默认URL创建新标签页
              createNewTab('${url}', '新标签页');
            }
          });

          // 创建新标签页
          function createNewTab(url, title) {
            const tabId = 'tab-' + Date.now();
            const tabElement = document.createElement('div');
            tabElement.className = 'tab';
            tabElement.id = tabId;
            tabElement.innerHTML = \`
              <span class="tab-title">\${title || '新标签页'}</span>
              <span class="tab-close" data-tab-id="\${tabId}">×</span>
            \`;

            // 在新标签页按钮之前插入新标签页
            const newTabBtn = document.getElementById('newTabBtn');
            if (newTabBtn && newTabBtn.parentNode) {
              newTabBtn.parentNode.insertBefore(tabElement, newTabBtn);
            } else {
              // 如果找不到新标签页按钮，插入到标题栏标签容器中
              const titleBarTabs = document.querySelector('.title-bar-tabs');
              if (titleBarTabs) {
                titleBarTabs.appendChild(tabElement);
              }
            }

            // 创建新的webview
            const newWebview = document.createElement('webview');
            newWebview.id = 'webview-' + tabId;
            newWebview.style.cssText = 'width: 100%; height: 100%; display: none;';
            newWebview.setAttribute('nodeintegration', 'false');
            newWebview.setAttribute('contextIsolation', 'true');
            newWebview.setAttribute('webpreferences', 'contextIsolation=true,nodeIntegration=false');
            newWebview.setAttribute('allowpopups', 'true'); // 明确设置为true以允许弹出窗口被拦截
            newWebview.setAttribute('webSecurity', 'true'); // 启用Web安全
            const basePartition = webview && webview.getAttribute('partition');
            if (basePartition) {
              newWebview.setAttribute('partition', basePartition);
            }

            document.querySelector('.webview-container').appendChild(newWebview);

            // 延迟设置src，确保WebView完全附加到DOM
            setTimeout(() => {
              if (url && url.startsWith('http')) {
                newWebview.src = url;
              } else {
                console.warn('Invalid URL for new webview:', url);
                newWebview.src = 'about:blank';
              }
            }, 50);

            // 保存标签页信息
            tabs.push({
              id: tabId,
              url: url,
              title: title || '新标签页',
              webview: newWebview
            });

            // 切换到新标签页
            switchToTab(tabId);

            // 为新标签页添加事件监听
            setupWebviewListeners(newWebview);
          }

          // 切换到指定标签页
          function switchToTab(tabId) {
            // 隐藏所有标签页和webview
            document.querySelectorAll('.tab').forEach(tab => {
              tab.classList.remove('active');
            });
            document.querySelectorAll('webview').forEach(wv => {
              wv.style.display = 'none';
            });

            // 显示选中的标签页和webview
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
              targetTab.classList.add('active');
            }

            let targetWebview;
            if (tabId === 'default') {
              targetWebview = webview;
            } else {
              targetWebview = document.getElementById('webview-' + tabId);
            }

            if (targetWebview) {
              // 取消使用 display:block，避免高度异常问题
              targetWebview.style.display = '';
              // 更新当前活动的webview引用
              window.currentWebview = targetWebview;

              // 延迟更新UI，确保WebView完全显示
              setTimeout(() => {
                // 更新URL显示
                if (urlInput) {
                  urlInput.value = targetWebview.src;
                  urlInput.title = targetWebview.src;
                }
                // 更新导航按钮状态
                updateNavButtons();
              }, 100);
            }

            activeTabId = tabId;
          }

          // 为webview添加事件监听
          function setupWebviewListeners(wv) {
            wv.addEventListener('dom-ready', () => {
              if (wv === window.currentWebview) {
                if (urlInput) {
                  urlInput.value = wv.src;
                  urlInput.title = wv.src;
                }
                updateNavButtons();
              }

              // 如果有待恢复的存储快照，在首次 dom-ready 时应用
              if (window.__pendingStorageSnapshot) {
                try {
                  var snapshot = window.__pendingStorageSnapshot;
                  window.__pendingStorageSnapshot = null;
                  var script = '(function(){try{var snapshot=' + JSON.stringify(snapshot) + ';' +
                    'var apply=function(target,data){if(!target||!data)return;for(var key in data){if(!Object.prototype.hasOwnProperty.call(data,key))continue;try{var value=data[key];if(value===null||typeof value==="undefined"){target.removeItem(key);}else{target.setItem(key,String(value));}}catch(e){}}};' +
                    'apply(window.localStorage,snapshot.localStorage);' +
                    'apply(window.sessionStorage,snapshot.sessionStorage);' +
                    '}catch(e){console.warn("恢复本地存储快照失败:",e);}})();';
                  wv.executeJavaScript(script).catch(function(e){console.error('应用存储快照失败:', e);});
                } catch (e) {
                  console.error('构造存储快照脚本失败:', e);
                  window.__pendingStorageSnapshot = null;
                }
              }
            });

            wv.addEventListener('did-navigate', () => {
              if (wv === window.currentWebview) {
                if (urlInput) {
                  urlInput.value = wv.src;
                  urlInput.title = wv.src;
                }
                updateNavButtons();
              }
            });

            // 处理新窗口打开请求（target="_blank"）
            // 注意：具体拦截逻辑已移动到主进程的 webContents.setWindowOpenHandler，
            // 然后通过 'webview-new-window' 事件通知当前窗口在标签页中打开。
            // 这里不再直接使用 webview 的 new-window 事件，以避免在不同 Electron 版本下行为不一致。

            // 处理页面标题更新
            wv.addEventListener('page-title-updated', (event) => {
              // 默认标签页的 webview.id 是 'webview'，需要特殊处理成 'default'
              const rawId = wv.id || '';
              const tabId = rawId === 'webview' ? 'default' : rawId.replace('webview-', '');
              const tab = document.getElementById(tabId);
              if (tab) {
                const titleElement = tab.querySelector('.tab-title');
                if (titleElement) {
                  titleElement.textContent = event.title || '新标签页';
                }
              }

              // 更新存储的标签页信息
              const tabInfo = tabs.find(t => t.id === tabId);
              if (tabInfo) {
                tabInfo.title = event.title || '新标签页';
              }
            });
          }

          // 更新导航按钮状态
          function updateNavButtons() {
            const currentWv = window.currentWebview || webview;
            if (currentWv && currentWv.getWebContentsId) {
              try {
                backBtn.disabled = !currentWv.canGoBack();
                forwardBtn.disabled = !currentWv.canGoForward();
              } catch (error) {
                // WebView还未准备好，设置为默认状态
                backBtn.disabled = true;
                forwardBtn.disabled = true;
              }
            } else {
              // WebView还未附加到DOM
              backBtn.disabled = true;
              forwardBtn.disabled = true;
            }
          }

          // 根据账号 partition 重建 webview，会清空所有标签页并只保留一个默认标签页
          function switchToAccountPartition(partition, storageSnapshot) {
            if (!partition) {
              return;
            }
            var container = document.querySelector('.webview-container');
            if (!container) {
              return;
            }

            // 记录待应用的存储快照，在新 webview dom-ready 时恢复
            if (storageSnapshot) {
              window.__pendingStorageSnapshot = storageSnapshot;
            } else {
              window.__pendingStorageSnapshot = null;
            }

            // 移除容器内所有 webview
            var existingWebviews = container.querySelectorAll('webview');
            existingWebviews.forEach(function (wv) {
              try {
                wv.remove();
              } catch (e) {}
            });

            // 重置标签页状态，只保留默认标签配置
            tabs = [];
            activeTabId = 'default';

            var newWebview = document.createElement('webview');
            newWebview.id = 'webview';
            newWebview.style.cssText = 'width: 100%; height: 100%;';
            newWebview.setAttribute('nodeintegration', 'false');
            newWebview.setAttribute('contextIsolation', 'true');
            newWebview.setAttribute('webpreferences', 'contextIsolation=true,nodeIntegration=false');
            newWebview.setAttribute('allowpopups', 'true');
            newWebview.setAttribute('webSecurity', 'true');
            newWebview.setAttribute('partition', partition);

            var targetUrl = (urlInput && urlInput.value) || '${url}';
            if (targetUrl && (targetUrl.indexOf('http://') === 0 || targetUrl.indexOf('https://') === 0)) {
              newWebview.src = targetUrl;
            } else {
              newWebview.src = '${url}';
            }

            container.appendChild(newWebview);

            window.currentWebview = newWebview;
            setupWebviewListeners(newWebview);

            tabs.push({
              id: 'default',
              url: newWebview.src,
              title: '${websiteName || '新标签页'}',
              webview: newWebview,
            });

            setTimeout(function () {
              if (urlInput) {
                urlInput.value = newWebview.src;
                urlInput.title = newWebview.src;
              }
              updateNavButtons();
            }, 200);
          }

          // 标签页点击事件委托
          document.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) {
              return;
            }
            // 标签页点击切换
            if (target.closest('.tab') && !target.classList.contains('tab-close')) {
              const tab = target.closest('.tab');
              const tabId = tab && tab.id;
              if (tabId && tabs.find(t => t.id === tabId)) {
                switchToTab(tabId);
              }
            }

            // 标签页关闭按钮（左键点击关闭图标）
            if (target.classList.contains('tab-close')) {
              const tabId = target.getAttribute('data-tab-id');
              if (tabId) {
                closeTab(tabId);
              }
            }
          });

          // 标签页鼠标中键关闭功能
          document.addEventListener('auxclick', (e) => {
            if (e.button !== 1) return;
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;
            const tabElement = target.closest('.tab');
            if (!tabElement) return;
            const tabId = tabElement.id;
            if (!tabId) return;
            closeTab(tabId);
          });

          // 关闭标签页
          function closeTab(tabId) {
            const tabIndex = tabs.findIndex(t => t.id === tabId);
            if (tabIndex === -1) return;

            const tabInfo = tabs[tabIndex];

            const tabElement = document.getElementById(tabId);
            if (tabElement) {
              tabElement.remove();
            }

            if (tabInfo.webview) {
              tabInfo.webview.remove();
            }

            tabs.splice(tabIndex, 1);

            if (tabs.length === 0) {
              const homeUrl = '${url}';
              createNewTab(homeUrl, '新标签页');
              return;
            }

            if (activeTabId === tabId) {
              const newActiveTab = tabs[tabIndex] || tabs[tabIndex - 1] || tabs[0];
              if (newActiveTab) {
                switchToTab(newActiveTab.id);
              }
            }
          }

          if (window.ipcRenderer) {
            window.ipcRenderer.on('window-state-changed', (_event, isMaximized) => {
              const maximizeIcon = maximizeBtn.querySelector('svg');
              if (!maximizeIcon) return;
              if (isMaximized) {
                maximizeIcon.innerHTML = '<rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/><rect x="4" y="4" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>';
                maximizeBtn.title = '向下还原';
              } else {
                maximizeIcon.innerHTML = '<rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>';
                maximizeBtn.title = '最大化';
              }
            });

            window.ipcRenderer.on('webview-new-window', (_event, newUrl) => {
              try {
                if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
                  createNewTab(newUrl, '新标签页');
                }
              } catch (error) {
                console.error('Error handling webview-new-window IPC:', error);
              }
            });
          }

          window.currentWebview = webview;

          backBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv && currentWv.canGoBack && currentWv.canGoBack()) {
              currentWv.goBack();
            }
          });

          forwardBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv && currentWv.canGoForward && currentWv.canGoForward()) {
              currentWv.goForward();
            }
          });

          homeBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv) {
              currentWv.src = '${url}';
            }
          });

          if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
              const currentWv = window.currentWebview;
              if (currentWv) {
                currentWv.reload();
              }
            });
          }
          
          if (addBtn) {
            addBtn.addEventListener('click', () => {
              if (window.ipcRenderer) {
                // 即使 websiteId 为空，也发送消息，让主进程尝试通过 URL 查找
                window.ipcRenderer.send('open-add-button-modal', websiteId);
              }
            });
          }
          
          if (urlInput) {
            urlInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                const url = urlInput.value;
                if (url) {
                  let finalUrl = url;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    finalUrl = 'http://' + url;
                  }
                  const currentWv = window.currentWebview;
                  if (currentWv) {
                    currentWv.src = finalUrl;
                    urlInput.blur();
                  }
                }
              } else if (e.key === 'Escape') {
                const currentWv = window.currentWebview;
                if (currentWv) {
                  urlInput.value = currentWv.src;
                  urlInput.blur();
                }
              }
            });
            
            urlInput.addEventListener('focus', () => {
              urlInput.select();
            });
            
            urlInput.addEventListener('blur', () => {
              const currentWv = window.currentWebview;
              if (currentWv) {
                // Delay slightly to allow click events on other buttons to process
                setTimeout(() => {
                   if (document.activeElement !== urlInput) {
                     urlInput.value = currentWv.src;
                   }
                }, 200);
              }
            });
          }

          function getAccountKey() {
            try {
              const currentWv = window.currentWebview || webview;
              const currentUrl = currentWv && currentWv.src ? currentWv.src : '${url}';
              const u = new URL(currentUrl);
              return u.origin;
            } catch (e) {
              try {
                const u = new URL('${url}');
                return u.origin;
              } catch {
                return websiteId || 'default-account-key';
              }
            }
          }

          async function loadAccounts() {
            if (!window.ipcRenderer) return;
            const key = getAccountKey();
            accountState.key = key;
            try {
              let group = await window.ipcRenderer.invoke('account-get-list', { key });

              if (!group || !Array.isArray(group.accounts)) {
                group = { key, accounts: [], lastUsedAccountId: undefined };
              }

              if ((!group.accounts || group.accounts.length === 0) && window.currentWebview && window.currentWebview.getWebContentsId && window.currentWebview.executeJavaScript) {
                const currentWv = window.currentWebview;
                const webContentsId = currentWv.getWebContentsId();
                const currentUrl = currentWv.src || '${url}';
                try {
                  const storageSnapshot = await currentWv.executeJavaScript('(function(){try{var makePlain=function(storage){var result={};if(!storage)return result;for(var i=0;i<storage.length;i++){var key=storage.key(i);try{result[key]=storage.getItem(key);}catch(e){result[key]=null;}}return result;};return{localStorage:makePlain(window.localStorage),sessionStorage:makePlain(window.sessionStorage)};}catch(e){console.warn("读取本地存储快照失败:",e);return{localStorage:{},sessionStorage:{}};}})();');
                  group = await window.ipcRenderer.invoke('account-save-from-cookies', {
                    key,
                    name: '默认',
                    webContentsId,
                    url: currentUrl,
                    storage: storageSnapshot,
                  });
                } catch (autoError) {
                  console.warn('自动创建默认账号失败，将继续使用空列表:', autoError);
                }
              }

              accountState.list = Array.isArray(group.accounts) ? group.accounts : [];
              accountState.selectedAccountId = group.lastUsedAccountId || (accountState.list[0] && accountState.list[0].id) || '';
              renderAccountList();
            } catch (error) {
              console.error('加载账号列表失败:', error);
            }
          }

          function openAccountModal() {
            if (!accountModalMask) return;
            accountModalMask.classList.add('show');
            accountInputRow.style.display = 'none';
            accountNameError.style.display = 'none';
            accountNameInput.value = '';
            accountState.editingAccountId = '';
            loadAccounts();
          }

          function closeAccountModal() {
            if (!accountModalMask) return;
            accountModalMask.classList.remove('show');
          }

          function renderAccountList() {
            if (!accountList) return;
            accountList.innerHTML = '';

            if (!accountState.list || accountState.list.length === 0) {
              const empty = document.createElement('div');
              empty.className = 'account-empty';
              empty.textContent = '暂无账号，点击上方“添加”保存当前登录状态为一个账号。';
              accountList.appendChild(empty);
              return;
            }

            accountState.list.forEach((item) => {
              const row = document.createElement('div');
              row.className = 'account-item';

              const left = document.createElement('div');
              left.className = 'account-item-left';

              const radio = document.createElement('input');
              radio.type = 'radio';
              radio.name = 'account-radio';
              radio.value = item.id;
              if (item.id === accountState.selectedAccountId) {
                radio.checked = true;
              }

              const nameSpan = document.createElement('span');
              nameSpan.className = 'account-name';
              nameSpan.textContent = item.name || '未命名账号';

              left.appendChild(radio);
              left.appendChild(nameSpan);

              if (item.id === accountState.list[0].id) {
                const tag = document.createElement('span');
                tag.className = 'account-tag-default';
                tag.textContent = '默认';
                left.appendChild(tag);
              }

              const actions = document.createElement('div');
              actions.className = 'account-actions';

              const editBtn = document.createElement('button');
              editBtn.className = 'account-small-btn';
              editBtn.textContent = '编辑';
              editBtn.addEventListener('click', () => {
                accountInputRow.style.display = 'flex';
                accountNameError.style.display = 'none';
                accountNameInput.value = item.name || '';
                accountState.editingAccountId = item.id;
                accountNameInput.focus();
              });

              const deleteBtn = document.createElement('button');
              deleteBtn.className = 'account-small-btn account-small-btn-danger';
              deleteBtn.textContent = '删除';
              deleteBtn.addEventListener('click', async () => {
                if (!window.ipcRenderer) return;
                try {
                  await window.ipcRenderer.invoke('account-delete', { key: accountState.key || getAccountKey(), accountId: item.id });
                  await loadAccounts();
                } catch (error) {
                  console.error('删除账号失败:', error);
                }
              });

              actions.appendChild(editBtn);
              actions.appendChild(deleteBtn);

              row.appendChild(left);
              row.appendChild(actions);

              row.addEventListener('click', (event) => {
                if (event.target === editBtn || event.target === deleteBtn) {
                  return;
                }
                accountState.selectedAccountId = item.id;
                renderAccountList();
              });

              radio.addEventListener('change', () => {
                accountState.selectedAccountId = item.id;
              });

              accountList.appendChild(row);
            });
          }

          async function captureAndSaveCurrentAccountSnapshot() {
            if (!window.ipcRenderer) return;
            const currentWv = window.currentWebview || webview;
            if (!currentWv || !currentWv.executeJavaScript) return;

            const key = accountState.key || getAccountKey();
            try {
              let group = await window.ipcRenderer.invoke('account-get-list', { key });
              if (!group || !Array.isArray(group.accounts)) {
                group = { key: key, accounts: [], lastUsedAccountId: undefined };
              }

              const partitionAttr = currentWv.getAttribute && currentWv.getAttribute('partition');
              let currentAccount = null;
              if (group.accounts && group.accounts.length > 0) {
                if (partitionAttr) {
                  currentAccount = group.accounts.find(function (item) { return item.partition === partitionAttr; });
                }
                if (!currentAccount) {
                  const fallbackId = group.lastUsedAccountId || (group.accounts[0] && group.accounts[0].id);
                  if (fallbackId) {
                    currentAccount = group.accounts.find(function (item) { return item.id === fallbackId; }) || currentAccount;
                  }
                }
              }

              const storageSnapshot = await currentWv.executeJavaScript('(function(){try{var makePlain=function(storage){var result={};if(!storage)return result;for(var i=0;i<storage.length;i++){var key=storage.key(i);try{result[key]=storage.getItem(key);}catch(e){result[key]=null;}}return result;};return{localStorage:makePlain(window.localStorage),sessionStorage:makePlain(window.sessionStorage)};}catch(e){console.warn("读取本地存储快照失败:",e);return{localStorage:{},sessionStorage:{}};}})();');

              const payload = {
                key: key,
                accountId: currentAccount ? currentAccount.id : undefined,
                name: currentAccount ? (currentAccount.name || '默认') : '默认',
                storage: storageSnapshot,
              };
              await window.ipcRenderer.invoke('account-save-from-cookies', payload);
            } catch (error) {
              console.error('保存当前账号存储快照失败:', error);
            }
          }

          if (switchBtn) {
            switchBtn.addEventListener('click', async () => {
              await captureAndSaveCurrentAccountSnapshot();
              openAccountModal();
            });
          }

          if (accountModalClose) {
            accountModalClose.addEventListener('click', () => {
              closeAccountModal();
            });
          }

          if (accountCancelBtn) {
            accountCancelBtn.addEventListener('click', () => {
              closeAccountModal();
            });
          }

          if (accountAddBtn) {
            accountAddBtn.addEventListener('click', () => {
              accountInputRow.style.display = 'flex';
              accountNameError.style.display = 'none';
              accountNameInput.value = '';
              accountState.editingAccountId = '';
              accountNameInput.focus();
            });
          }

          function validateAccountName() {
            const name = (accountNameInput.value || '').trim();
            if (!name) {
              accountNameError.style.display = 'block';
              accountNameInput.classList.add('account-input-error');
              return false;
            }
            accountNameError.style.display = 'none';
            accountNameInput.classList.remove('account-input-error');
            return true;
          }

          if (accountSaveBtn) {
            accountSaveBtn.addEventListener('click', async () => {
              if (!validateAccountName()) return;
              if (!window.ipcRenderer) return;

              const name = accountNameInput.value.trim();
              const currentWv = window.currentWebview || webview;
              if (!currentWv || !currentWv.getWebContentsId || !currentWv.executeJavaScript) return;
              const webContentsId = currentWv.getWebContentsId();
              const currentUrl = currentWv.src || '${url}';

              try {
                const storageSnapshot = await currentWv.executeJavaScript('(function(){try{var makePlain=function(storage){var result={};if(!storage)return result;for(var i=0;i<storage.length;i++){var key=storage.key(i);try{result[key]=storage.getItem(key);}catch(e){result[key]=null;}}return result;};return{localStorage:makePlain(window.localStorage),sessionStorage:makePlain(window.sessionStorage)};}catch(e){console.warn("读取本地存储快照失败:",e);return{localStorage:{},sessionStorage:{}};}})();');

                const group = await window.ipcRenderer.invoke('account-save-from-cookies', {
                  key: accountState.key || getAccountKey(),
                  accountId: accountState.editingAccountId || undefined,
                  name,
                  webContentsId,
                  url: currentUrl,
                  storage: storageSnapshot,
                });
                accountState.list = Array.isArray(group.accounts) ? group.accounts : [];
                accountState.selectedAccountId = group.lastUsedAccountId || (accountState.list[0] && accountState.list[0].id) || '';
                accountInputRow.style.display = 'none';
                accountNameInput.value = '';
                accountState.editingAccountId = '';
                renderAccountList();
              } catch (error) {
                console.error('保存账号失败:', error);
              }
            });
          }

          if (accountNameInput) {
            accountNameInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                accountSaveBtn.click();
              }
            });
          }

          if (accountConfirmBtn) {
            accountConfirmBtn.addEventListener('click', async () => {
              if (!window.ipcRenderer) {
                closeAccountModal();
                return;
              }

              if (!accountState.selectedAccountId && accountState.list.length > 0) {
                accountState.selectedAccountId = accountState.list[0].id;
              }

              if (!accountState.selectedAccountId) {
                closeAccountModal();
                return;
              }

              try {
                const key = accountState.key || getAccountKey();
                const accountId = accountState.selectedAccountId;
                const group = await window.ipcRenderer.invoke('account-apply', {
                  key: key,
                  accountId: accountId,
                });

                if (group && group.accounts && group.accounts.length > 0) {
                  accountState.list = group.accounts;
                  accountState.selectedAccountId = group.lastUsedAccountId || accountId;

                  var targetAccount = group.accounts.find(function (item) {
                    return item.id === accountState.selectedAccountId;
                  });

                  if (targetAccount && targetAccount.partition) {
                    switchToAccountPartition(targetAccount.partition, targetAccount.storageSnapshot || null);
                  }
                }
              } catch (error) {
                console.error('切换账号失败:', error);
              }

              closeAccountModal();
            });
          }

          setupWebviewListeners(webview);

          window.addEventListener('message', (event) => {
            if (event.data.type === 'updateCustomButtons') {
              updateCustomButtons(event.data.buttons);
            } else if (event.data.type === 'navigateToUrl') {
              webview.src = event.data.url;
            }
          });

          function updateCustomButtons(buttons) {
            const container = document.getElementById('customButtons');
            if (!container) return;
            container.innerHTML = '';

            if (buttons && buttons.length > 0) {
              buttons.forEach((button) => {
                const btn = document.createElement('button');
                btn.className = 'ant-btn ant-btn-primary';
                btn.textContent = button.name;
                btn.title = button.name;
                btn.style.cssText = 'font-size: 12px; padding: 2px 8px; height: 24px;';
                btn.addEventListener('click', () => {
                  const targetWebview = window.currentWebview || webview;
                  if (button.openMode === 'currentPage') {
                    if (targetWebview) {
                      targetWebview.src = button.url;
                    }
                  } else if (button.openMode === 'newTab') {
                    try {
                      createNewTab(button.url, button.name || '新标签页');
                    } catch (error) {
                      console.error('createNewTab failed, fallback to new window:', error);
                      window.parent.postMessage({
                        type: 'openNewWindow',
                        url: button.url,
                        name: button.name
                      }, '*');
                    }
                  } else {
                    window.parent.postMessage({
                      type: 'openNewWindow',
                      url: button.url,
                      name: button.name
                    }, '*');
                  }
                });
                container.appendChild(btn);
              });
            }
          }

          window.parent.postMessage({ type: 'requestCustomButtons' }, '*');

          tabs.push({
            id: 'default',
            url: '${url}',
            title: '${websiteName || '新标签页'}',
            webview: webview
          });
          activeTabId = 'default';
        </script>
      </body>
    </html>
  `;
}