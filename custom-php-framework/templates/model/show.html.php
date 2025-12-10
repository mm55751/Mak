<?php
/** @var \App\Model\ModelItem $item */
/** @var \App\Service\Router $router */

$title = 'MODEL – szczegóły';
$bodyClass = 'show';

ob_start(); ?>
    <h1><?= $item->getModel() ?> (ID: <?= (int)$item->getId() ?>)</h1>

    <dl>
        <dt>TYP</dt><dd><?= $item->getTyp() ?></dd>
        <dt>ROK</dt><dd><?= (int)$item->getRok() ?></dd>
        <dt>MODEL</dt><dd><?= $item->getModel() ?></dd>
    </dl>

    <ul class="action-list">
        <li><a href="<?= $router->generatePath('model-index') ?>">Powrót do listy</a></li>
        <li><a href="<?= $router->generatePath('model-edit', ['id'=> $item->getId()]) ?>">Edytuj</a></li>
    </ul>

<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';