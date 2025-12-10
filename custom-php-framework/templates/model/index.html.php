<?php
/** @var \App\Model\ModelItem[] $items */
/** @var \App\Service\Router $router */

$title = 'MODEL – lista';
$bodyClass = 'index';

ob_start(); ?>
    <h1>MODEL – lista</h1>

    <a href="<?= $router->generatePath('model-create') ?>">Dodaj nowy</a>

    <ul class="index-list">
        <?php foreach ($items as $item): ?>
            <li>
                <h3><?= $item->getModel() ?></h3>
                <div>(TYP: <?= $item->getTyp() ?>, ROK: <?= (int)$item->getRok() ?>)</div>
                <ul class="action-list">
                    <li><a href="<?= $router->generatePath('model-show', ['id' => $item->getId()]) ?>">Szczegóły</a></li>
                    <li><a href="<?= $router->generatePath('model-edit', ['id' => $item->getId()]) ?>">Edytuj</a></li>
                    <li><a href="<?= $router->generatePath('model-delete', ['id' => $item->getId()]) ?>" onclick="return confirm('Usunąć?')">Usuń</a></li>
                </ul>
            </li>
        <?php endforeach; ?>
    </ul>

<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';