<?php
namespace App\Controller;

use App\Exception\NotFoundException;
use App\Model\ModelItem;
use App\Service\Router;
use App\Service\Templating;

class ModelController
{
    public function indexAction(Templating $templating, Router $router): ?string
    {
        $items = ModelItem::findAll();
        return $templating->render('model/index.html.php', [
            'items' => $items,
            'router' => $router,
        ]);
    }

    public function createAction(?array $requestData, Templating $templating, Router $router): ?string
    {
        if ($requestData) {
            $item = ModelItem::fromArray($requestData);
            $item->save();
            $router->redirect($router->generatePath('model-index'));
            return null;
        }
        return $templating->render('model/create.html.php', [
            'item' => new ModelItem(),
            'router' => $router,
        ]);
    }

    public function editAction(int $id, ?array $requestData, Templating $templating, Router $router): ?string
    {
        $item = ModelItem::find($id);
        if (! $item) {
            throw new NotFoundException("Missing model with id $id");
        }
        if ($requestData) {
            $item->fill($requestData);
            $item->save();
            $router->redirect($router->generatePath('model-index'));
            return null;
        }
        return $templating->render('model/edit.html.php', [
            'item' => $item,
            'router' => $router,
        ]);
    }

    public function showAction(int $id, Templating $templating, Router $router): ?string
    {
        $item = ModelItem::find($id);
        if (! $item) {
            throw new NotFoundException("Missing model with id $id");
        }
        return $templating->render('model/show.html.php', [
            'item' => $item,
            'router' => $router,
        ]);
    }

    public function deleteAction(int $id, Router $router): ?string
    {
        $item = ModelItem::find($id);
        if ($item) {
            $item->delete();
        }
        $router->redirect($router->generatePath('model-index'));
        return null;
    }
}