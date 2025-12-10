<?php
/** @var \App\Model\ModelItem $item */
/** @var \App\Service\Router $router */

$title = 'MODEL – utwórz';
$bodyClass = 'create';

ob_start(); ?>
    <h1>Utwórz MODEL</h1>

    <form action="<?= $router->generatePath('model-create') ?>" method="post" class="edit-form">
        <input type="hidden" name="action" value="model-create">
        <?php include __DIR__ . DIRECTORY_SEPARATOR . '_form.html.php'; ?>
    </form>

    <ul class="action-list">
        <li><a href="<?= $router->generatePath('model-index') ?>">Powrót do listy</a></li>
    </ul>

<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';