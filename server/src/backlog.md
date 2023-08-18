文件解析

- 入口: vueServerMain.ts
- 语言功能入口: vls.ts->setupLSPHandlers
- 实际语言服务: projectService.ts
- 其他语言模块: languageModes.ts->init
- 嵌套TLS服务: serviceHost.ts->init->createLanguageServiceHost

依赖排除规则

- from\s+'(?!(\.|vscode|path|fs|os))
- include: ./server/**/*.ts
- exclude: `**/*.d.ts,**/*.test.ts`
