export enum AppNode {
  DEFAULT = '',
  PUBLIC = '',
  LIST = 'list',
  DETAIL = 'detail/',
  DASHBOARD = 'dashboard',
  HOME='home',
  REDIRECT_TO_PUBLIC = AppNode.DEFAULT,
  REDIRECT_TO_AUTHENTICATED = AppNode.DASHBOARD,
  FALL_BACK = '**',
  ACCOUNT = 'account',
}
