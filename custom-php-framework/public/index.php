<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'autoload.php';

$config = new \App\Service\Config();

$templating = new \App\Service\Templating();
$router = new \App\Service\Router();

$action = $_REQUEST['action'] ?? null;
switch ($action) {
    case 'post-index':
    case null:
        $controller = new \App\Controller\PostController();
        $view = $controller->indexAction($templating, $router);
        break;
    case 'post-create':
        $controller = new \App\Controller\PostController();
        $view = $controller->createAction($_REQUEST['post'] ?? null, $templating, $router);
        break;
    case 'post-edit':
        if (! $_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\PostController();
        $view = $controller->editAction($_REQUEST['id'], $_REQUEST['post'] ?? null, $templating, $router);
        break;
    case 'post-show':
        if (! $_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\PostController();
        $view = $controller->showAction($_REQUEST['id'], $templating, $router);
        break;
    case 'post-delete':
        if (! $_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\PostController();
        $view = $controller->deleteAction($_REQUEST['id'], $router);
        break;
    case 'info':
        $controller = new \App\Controller\InfoController();
        $view = $controller->infoAction();
        break;


    case 'model-index':
        $controller = new \App\Controller\ModelController();
        $view = $controller->indexAction($templating, $router);
        break;
    case 'model-create':
        $controller = new \App\Controller\ModelController();
        $view = $controller->createAction($_REQUEST['model'] ?? null, $templating, $router);
        break;
    case 'model-edit':
        if (!$_REQUEST['id']) { break; }
        $controller = new \App\Controller\ModelController();
        $view = $controller->editAction((int)$_REQUEST['id'], $_REQUEST['model'] ?? null, $templating, $router);
        break;
    case 'model-show':
        if (!$_REQUEST['id']) { break; }
        $controller = new \App\Controller\ModelController();
        $view = $controller->showAction((int)$_REQUEST['id'], $templating, $router);
        break;
    case 'model-delete':
        if (!$_REQUEST['id']) { break; }
        $controller = new \App\Controller\ModelController();
        $view = $controller->deleteAction((int)$_REQUEST['id'], $router);
        break;
    default:
        $view = 'Not found';
        break;
}

if ($view) {
    echo $view;
}
